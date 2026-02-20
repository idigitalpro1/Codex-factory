from __future__ import annotations

import json
import os
from datetime import date as _date, datetime, timezone

from app.db import db
from app.models import Invoice

# ── Google Sheets (optional) ─────────────────────────────────────────────────
_SHEETS_OK = False
try:
    import gspread
    from google.oauth2.service_account import Credentials as _GCreds
    _SHEETS_OK = True
except ImportError:
    pass

_SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive",
]
_SHEET_TAB  = os.environ.get("BILLING_SHEET_TAB", "Invoices")
_SHEET_ID   = os.environ.get("BILLING_SPREADSHEET_ID", "")
_CREDS_PATH = os.environ.get("GOOGLE_CREDENTIALS_PATH", "")

_COLUMNS = [
    "id", "date", "client", "email", "type", "description", "amount",
    "status", "publication", "runDates", "lineCount", "runs",
    "firstLineRate", "additionalLineRate", "originationFee",
    "isArapahoeCounty", "pdfUrl", "stripeLink", "emailSent",
    "paidDate", "notes", "created_at", "updated_at",
]


def _use_sheets() -> bool:
    return bool(_SHEETS_OK and _SHEET_ID and _CREDS_PATH
                and os.path.exists(_CREDS_PATH))


def _get_ws():
    creds = _GCreds.from_service_account_file(_CREDS_PATH, scopes=_SCOPES)
    gc = gspread.authorize(creds)
    sh = gc.open_by_key(_SHEET_ID)
    try:
        return sh.worksheet(_SHEET_TAB)
    except gspread.WorksheetNotFound:
        ws = sh.add_worksheet(_SHEET_TAB, rows=1000, cols=len(_COLUMNS))
        ws.append_row(_COLUMNS)
        return ws


def _dict_to_row(d: dict) -> list:
    return [str(d.get(c, "")) for c in _COLUMNS]


def _row_to_dict(row: dict) -> dict:
    return {k: row.get(k, "") for k in _COLUMNS}


# ── Public interface ──────────────────────────────────────────────────────────

def list_invoices(status: str | None = None, q: str | None = None) -> list[dict]:
    if _use_sheets():
        ws = _get_ws()
        rows = ws.get_all_records()
        results = [_row_to_dict(r) for r in rows]
    else:
        query = Invoice.query.order_by(Invoice.created_at.desc())
        if status:
            query = query.filter_by(status=status)
        rows = query.all()
        results = [r.to_dict() for r in rows]
        if q:
            ql = q.lower()
            results = [r for r in results if
                       ql in r["client"].lower() or
                       ql in r["email"].lower() or
                       ql in r["description"].lower()]
        return results

    if status:
        results = [r for r in results if r.get("status") == status]
    if q:
        ql = q.lower()
        results = [r for r in results if
                   ql in str(r.get("client", "")).lower() or
                   ql in str(r.get("email", "")).lower() or
                   ql in str(r.get("description", "")).lower()]
    return results


def get_invoice(inv_id: str) -> dict | None:
    if _use_sheets():
        ws = _get_ws()
        for row in ws.get_all_records():
            if row.get("id") == inv_id:
                return _row_to_dict(row)
        return None
    row = Invoice.query.get(inv_id)
    return row.to_dict() if row else None


def create_invoice(data: dict) -> dict:
    run_dates = data.get("runDates", [])
    if isinstance(run_dates, str):
        try:
            run_dates = json.loads(run_dates)
        except Exception:
            run_dates = []

    runs = len(run_dates) or int(data.get("runs", 1))
    line_count = int(data.get("lineCount", 1))
    first_rate = float(data.get("firstLineRate", 0.43))
    add_rate   = float(data.get("additionalLineRate", 0.38))
    orig_fee   = float(data.get("originationFee", 25.0))
    amount = round(orig_fee + runs * first_rate + runs * max(0, line_count - 1) * add_rate, 2)

    now = datetime.now(timezone.utc).isoformat()
    today = _date.today().isoformat()

    if _use_sheets():
        import uuid
        inv_id = str(uuid.uuid4())
        row_data = {
            "id": inv_id,
            "date": data.get("date", today),
            "client": data.get("client", ""),
            "email": data.get("email", ""),
            "type": data.get("type", "Classified Ad"),
            "description": data.get("description", ""),
            "amount": amount,
            "status": "draft",
            "publication": data.get("publication", "Register-Call"),
            "runDates": json.dumps(run_dates),
            "lineCount": line_count,
            "runs": runs,
            "firstLineRate": first_rate,
            "additionalLineRate": add_rate,
            "originationFee": orig_fee,
            "isArapahoeCounty": str(data.get("isArapahoeCounty", False)),
            "pdfUrl": "",
            "stripeLink": "",
            "emailSent": "",
            "paidDate": "",
            "notes": data.get("notes", ""),
            "created_at": now,
            "updated_at": now,
        }
        ws = _get_ws()
        ws.append_row(_dict_to_row(row_data))
        return row_data

    row = Invoice(
        date=data.get("date", today),
        client=data.get("client", ""),
        email=data.get("email", ""),
        type=data.get("type", "Classified Ad"),
        description=data.get("description", ""),
        amount=amount,
        status="draft",
        publication=data.get("publication", "Register-Call"),
        run_dates=json.dumps(run_dates),
        line_count=line_count,
        runs=runs,
        first_line_rate=first_rate,
        additional_line_rate=add_rate,
        origination_fee=orig_fee,
        is_arapahoe_county=bool(data.get("isArapahoeCounty", False)),
        notes=data.get("notes", ""),
    )
    db.session.add(row)
    db.session.commit()
    return row.to_dict()


_PATCHABLE = {
    "date", "client", "email", "type", "description", "amount", "status",
    "publication", "runDates", "lineCount", "runs", "firstLineRate",
    "additionalLineRate", "originationFee", "isArapahoeCounty",
    "pdfUrl", "stripeLink", "emailSent", "paidDate", "notes",
}

_COL_MAP = {
    "runDates": "run_dates", "lineCount": "line_count", "runs": "runs",
    "firstLineRate": "first_line_rate", "additionalLineRate": "additional_line_rate",
    "originationFee": "origination_fee", "isArapahoeCounty": "is_arapahoe_county",
    "pdfUrl": "pdf_url", "stripeLink": "stripe_link", "emailSent": "email_sent",
    "paidDate": "paid_date",
}


def update_invoice(inv_id: str, data: dict) -> dict | None:
    now = datetime.now(timezone.utc).isoformat()

    if _use_sheets():
        ws = _get_ws()
        headers = ws.row_values(1)
        for i, row in enumerate(ws.get_all_records(), start=2):
            if row.get("id") == inv_id:
                for key, val in data.items():
                    if key in _PATCHABLE and key in headers:
                        ws.update_cell(i, headers.index(key) + 1, val)
                if "updated_at" in headers:
                    ws.update_cell(i, headers.index("updated_at") + 1, now)
                row.update(data)
                row["updated_at"] = now
                return row
        return None

    row = Invoice.query.get(inv_id)
    if row is None:
        return None
    for key, val in data.items():
        if key not in _PATCHABLE:
            continue
        attr = _COL_MAP.get(key, key)
        if attr == "is_arapahoe_county":
            val = bool(val)
        setattr(row, attr, val)
    db.session.commit()
    return row.to_dict()
