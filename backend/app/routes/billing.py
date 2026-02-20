from __future__ import annotations

import json
import os
import smtplib
from datetime import date as _date, datetime, timezone
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

from flask import Blueprint, Response, abort, jsonify, request

from app.services import billing_store as store

billing_bp = Blueprint("billing", __name__)

CC_ADDRESS = "invoices.gizmo@gmail.com"


# ── Invoices ──────────────────────────────────────────────────────────────────

@billing_bp.get("/billing/invoices")
def list_invoices():
    status = request.args.get("status") or None
    q      = request.args.get("q") or None
    items  = store.list_invoices(status=status, q=q)
    return jsonify({"invoices": items, "total": len(items)})


@billing_bp.post("/billing/invoices")
def create_invoice():
    data = request.get_json(silent=True) or {}
    if not str(data.get("client", "")).strip():
        abort(400, description="client is required")
    inv = store.create_invoice(data)
    return jsonify(inv), 201


@billing_bp.patch("/billing/invoices/<inv_id>")
def update_invoice(inv_id: str):
    data = request.get_json(silent=True) or {}
    inv  = store.update_invoice(inv_id, data)
    if inv is None:
        abort(404, description="Invoice not found")
    return jsonify(inv)


# ── Stripe ────────────────────────────────────────────────────────────────────

@billing_bp.post("/billing/stripe/link")
def stripe_link():
    data   = request.get_json(silent=True) or {}
    inv_id = data.get("invoice_id")
    if not inv_id:
        abort(400, description="invoice_id required")

    inv = store.get_invoice(inv_id)
    if not inv:
        abort(404, description="Invoice not found")

    stripe_key = os.environ.get("STRIPE_SECRET_KEY", "")
    if stripe_key:
        try:
            import stripe as _stripe  # type: ignore
            _stripe.api_key = stripe_key
            amount_cents = int(float(inv.get("amount", 0)) * 100)
            session = _stripe.checkout.Session.create(
                payment_method_types=["card"],
                line_items=[{
                    "price_data": {
                        "currency": "usd",
                        "product_data": {"name": f"Ad Invoice – {inv.get('client')}"},
                        "unit_amount": amount_cents,
                    },
                    "quantity": 1,
                }],
                mode="payment",
                success_url=f"https://5280.menu/invoices?paid={inv_id}",
                cancel_url="https://5280.menu/invoices",
                metadata={"invoice_id": inv_id},
            )
            link = session.url
            store.update_invoice(inv_id, {"stripeLink": link, "status": "sent"})
            return jsonify({"link": link})
        except Exception as exc:
            return jsonify({"error": str(exc)}), 500

    # Stub when no Stripe key configured
    stub_link = f"https://buy.stripe.com/stub/{inv_id[:8]}"
    store.update_invoice(inv_id, {"stripeLink": stub_link})
    return jsonify({"link": stub_link, "stub": True})


@billing_bp.post("/billing/stripe/webhook")
def stripe_webhook():
    payload = request.data
    sig     = request.headers.get("Stripe-Signature", "")
    secret  = os.environ.get("STRIPE_WEBHOOK_SECRET", "")

    if secret:
        try:
            import stripe as _stripe  # type: ignore
            event = _stripe.Webhook.construct_event(payload, sig, secret)
        except Exception:
            abort(400)
    else:
        try:
            event = json.loads(payload)
        except Exception:
            abort(400)

    if event.get("type") == "checkout.session.completed":
        inv_id = (event.get("data", {})
                       .get("object", {})
                       .get("metadata", {})
                       .get("invoice_id"))
        if inv_id:
            store.update_invoice(inv_id, {
                "status": "paid",
                "paidDate": _date.today().isoformat(),
            })

    return jsonify({"received": True})


# ── Email ─────────────────────────────────────────────────────────────────────

@billing_bp.post("/billing/email/send")
def send_email():
    data   = request.get_json(silent=True) or {}
    inv_id = data.get("invoice_id")
    if not inv_id:
        abort(400, description="invoice_id required")

    inv = store.get_invoice(inv_id)
    if not inv:
        abort(404, description="Invoice not found")

    smtp_host = os.environ.get("SMTP_HOST", "smtp.gmail.com")
    smtp_port = int(os.environ.get("SMTP_PORT", "587"))
    smtp_user = os.environ.get("SMTP_USER", "")
    smtp_pass = os.environ.get("SMTP_PASS", "")

    if not smtp_user:
        return jsonify({"sent": False, "reason": "SMTP_USER not configured"}), 200

    to_addr = inv.get("email", "")
    if not to_addr:
        return jsonify({"sent": False, "reason": "invoice has no client email"}), 200

    subject = (f"Invoice — {inv.get('publication', 'Register-Call')} · "
               f"{inv.get('client')} · ${inv.get('amount', '0.00')}")

    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"]    = smtp_user
    msg["To"]      = to_addr
    msg["Cc"]      = CC_ADDRESS
    msg.attach(MIMEText(_email_html(inv), "html"))

    try:
        with smtplib.SMTP(smtp_host, smtp_port) as srv:
            srv.starttls()
            srv.login(smtp_user, smtp_pass)
            srv.sendmail(smtp_user, [to_addr, CC_ADDRESS], msg.as_string())

        store.update_invoice(inv_id, {
            "emailSent": datetime.now(timezone.utc).isoformat(),
            "status": "sent",
        })
        return jsonify({"sent": True})
    except Exception as exc:
        return jsonify({"sent": False, "error": str(exc)}), 500


# ── PDF (HTML template) ───────────────────────────────────────────────────────

@billing_bp.get("/billing/pdf/<inv_id>")
def get_pdf(inv_id: str):
    inv = store.get_invoice(inv_id)
    if not inv:
        abort(404, description="Invoice not found")
    return Response(_pdf_html(inv), mimetype="text/html")


# ── Helpers ───────────────────────────────────────────────────────────────────

def _parse_dates(raw) -> list[str]:
    if isinstance(raw, list):
        return raw
    try:
        return json.loads(raw or "[]")
    except Exception:
        return []


def _email_html(inv: dict) -> str:
    dates_str = ", ".join(_parse_dates(inv.get("runDates", "[]"))) or "TBD"
    stripe_btn = (
        f'<p style="margin-top:20px;">'
        f'<a href="{inv["stripeLink"]}" style="background:#b8860b;color:#fff;'
        f'padding:10px 22px;text-decoration:none;border-radius:4px;font-family:Georgia,serif;">'
        f'Pay Online →</a></p>'
    ) if inv.get("stripeLink") else ""

    return f"""<!DOCTYPE html>
<html><body style="font-family:Georgia,serif;max-width:620px;margin:40px auto;color:#1a1a1a;background:#fff;">
<div style="border-top:4px solid #b8860b;padding-top:16px;">
  <h2 style="margin:0 0 4px;font-size:1.4rem;">Weekly Register-Call</h2>
  <p style="margin:0;color:#666;font-size:0.9rem;">Black Hawk · Idaho Springs · Georgetown · Colorado</p>
</div>
<h3 style="margin-top:24px;border-bottom:1px solid #ddd;padding-bottom:8px;">Ad Invoice</h3>
<table style="width:100%;border-collapse:collapse;font-size:0.95rem;">
  <tr><td style="padding:7px 4px;color:#555;width:42%;">Client</td>
      <td style="padding:7px 4px;font-weight:bold;">{inv.get('client','')}</td></tr>
  <tr style="background:#f9f6f0;"><td style="padding:7px 4px;color:#555;">Email</td>
      <td style="padding:7px 4px;">{inv.get('email','')}</td></tr>
  <tr><td style="padding:7px 4px;color:#555;">Publication</td>
      <td style="padding:7px 4px;">{inv.get('publication','')}</td></tr>
  <tr style="background:#f9f6f0;"><td style="padding:7px 4px;color:#555;">Ad Type</td>
      <td style="padding:7px 4px;">{inv.get('type','')}</td></tr>
  <tr><td style="padding:7px 4px;color:#555;vertical-align:top;">Description</td>
      <td style="padding:7px 4px;">{inv.get('description','')}</td></tr>
  <tr style="background:#f9f6f0;"><td style="padding:7px 4px;color:#555;">Run Dates</td>
      <td style="padding:7px 4px;">{dates_str}</td></tr>
  <tr><td style="padding:7px 4px;color:#555;">Lines / Runs</td>
      <td style="padding:7px 4px;">{inv.get('lineCount',1)} lines × {inv.get('runs',1)} runs</td></tr>
  <tr style="background:#f9f6f0;"><td style="padding:7px 4px;color:#555;">First line rate</td>
      <td style="padding:7px 4px;">${inv.get('firstLineRate',0.43):.2f}/run</td></tr>
  <tr><td style="padding:7px 4px;color:#555;">Additional lines rate</td>
      <td style="padding:7px 4px;">${inv.get('additionalLineRate',0.38):.2f}/run</td></tr>
  <tr style="background:#f9f6f0;"><td style="padding:7px 4px;color:#555;">Origination fee</td>
      <td style="padding:7px 4px;">${inv.get('originationFee',25):.2f}</td></tr>
  <tr style="border-top:2px solid #b8860b;">
    <td style="padding:10px 4px;font-weight:bold;font-size:1.1rem;">TOTAL DUE</td>
    <td style="padding:10px 4px;font-weight:bold;font-size:1.1rem;color:#b8860b;">${inv.get('amount','0.00')}</td>
  </tr>
</table>
{stripe_btn}
<p style="margin-top:32px;font-size:0.8rem;color:#888;">
  Questions? Reply to this email or contact {CC_ADDRESS}<br>
  Weekly Register-Call · PO Box · Black Hawk, CO 80422
</p>
</body></html>"""


def _pdf_html(inv: dict) -> str:
    dates_str = ", ".join(_parse_dates(inv.get("runDates", "[]"))) or "TBD"
    inv_num   = inv.get("id", "")[:8].upper()
    return f"""<!DOCTYPE html>
<html><head><title>Invoice {inv_num}</title>
<style>
  body {{ font-family: Georgia, serif; max-width: 700px; margin: 50px auto; color: #1a1a1a; }}
  .header {{ border-top: 5px solid #b8860b; padding: 16px 0; margin-bottom: 24px; }}
  .header h1 {{ margin: 0 0 4px; font-size: 1.6rem; }}
  .inv-num {{ color: #666; font-size: 0.9rem; }}
  table {{ width: 100%; border-collapse: collapse; margin-top: 16px; }}
  td {{ padding: 9px 6px; border-bottom: 1px solid #e8e0d0; }}
  .label {{ color: #555; width: 42%; }}
  .total-row td {{ border-top: 2px solid #b8860b; font-weight: bold; font-size: 1.1rem; border-bottom: none; }}
  .total-val {{ color: #b8860b; }}
  @media print {{ body {{ margin: 20px; }} }}
</style>
</head><body>
<div class="header">
  <h1>Weekly Register-Call</h1>
  <p style="margin:0;color:#666;">Black Hawk · Idaho Springs · Georgetown · Colorado</p>
</div>
<h2 style="margin:0 0 4px;">Ad Invoice</h2>
<p class="inv-num">#{inv_num} &nbsp;·&nbsp; {inv.get('date','')}</p>
<table>
  <tr><td class="label">Client</td><td><strong>{inv.get('client','')}</strong></td></tr>
  <tr><td class="label">Email</td><td>{inv.get('email','')}</td></tr>
  <tr><td class="label">Publication</td><td>{inv.get('publication','')}</td></tr>
  <tr><td class="label">Ad Type</td><td>{inv.get('type','')}</td></tr>
  <tr><td class="label">Description</td><td>{inv.get('description','')}</td></tr>
  <tr><td class="label">Run Dates</td><td>{dates_str}</td></tr>
  <tr><td class="label">Lines</td><td>{inv.get('lineCount',1)}</td></tr>
  <tr><td class="label">Runs</td><td>{inv.get('runs',1)}</td></tr>
  <tr><td class="label">First line rate</td><td>${inv.get('firstLineRate',0.43):.2f}/run</td></tr>
  <tr><td class="label">Additional lines rate</td><td>${inv.get('additionalLineRate',0.38):.2f}/run</td></tr>
  <tr><td class="label">Origination fee</td><td>${inv.get('originationFee',25):.2f} (one-time)</td></tr>
  <tr class="total-row">
    <td class="label">TOTAL DUE</td>
    <td class="total-val">${inv.get('amount','0.00')}</td>
  </tr>
</table>
<p style="margin-top:40px;font-size:0.82rem;color:#888;">
  Thank you for advertising with the Weekly Register-Call.<br>
  Please remit payment to: Weekly Register-Call · PO Box · Black Hawk, CO 80422<br>
  Questions: {CC_ADDRESS}
</p>
<script>window.onload = () => window.print();</script>
</body></html>"""
