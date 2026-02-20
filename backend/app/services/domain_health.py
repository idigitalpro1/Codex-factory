from __future__ import annotations

import json
import time
import urllib.error
import urllib.request
from typing import Any


_TIMEOUT = 8  # seconds per request


def _fetch(url: str) -> dict[str, Any]:
    """Make a GET request; return status_code, final_url, response_ms, body_snippet."""
    start = time.monotonic()
    try:
        req = urllib.request.Request(url, headers={"User-Agent": "CodexOpsBot/1.0"})
        with urllib.request.urlopen(req, timeout=_TIMEOUT) as resp:
            elapsed_ms = int((time.monotonic() - start) * 1000)
            body = resp.read(4096).decode("utf-8", errors="replace")
            return {
                "ok": True,
                "status_code": resp.status,
                "final_url": resp.url,
                "response_ms": elapsed_ms,
                "body": body,
            }
    except urllib.error.HTTPError as e:
        elapsed_ms = int((time.monotonic() - start) * 1000)
        return {
            "ok": False,
            "status_code": e.code,
            "final_url": url,
            "response_ms": elapsed_ms,
            "body": "",
        }
    except Exception:
        elapsed_ms = int((time.monotonic() - start) * 1000)
        return {
            "ok": False,
            "status_code": 0,
            "final_url": url,
            "response_ms": elapsed_ms,
            "body": "",
        }


def _check_homepage(homepage_url: str | None) -> dict[str, Any]:
    if not homepage_url:
        return {"ok": False, "status_code": 0, "final_url": "", "response_ms": 0}
    result = _fetch(homepage_url)
    return {
        "ok": result["ok"] and 200 <= result["status_code"] < 300,
        "status_code": result["status_code"],
        "final_url": result["final_url"],
        "response_ms": result["response_ms"],
    }


def _check_api(health_url: str | None) -> dict[str, Any]:
    if not health_url:
        return {"ok": False, "status_code": 0, "response_ms": 0}
    result = _fetch(health_url)
    api_ok = False
    if result["ok"]:
        try:
            data = json.loads(result["body"])
            api_ok = data.get("status") == "ok"
        except (json.JSONDecodeError, AttributeError):
            api_ok = 200 <= result["status_code"] < 300
    return {
        "ok": api_ok,
        "status_code": result["status_code"],
        "response_ms": result["response_ms"],
    }


def _check_cms(homepage_url: str | None) -> dict[str, Any]:
    if not homepage_url:
        return {"ok": False, "detail": "no_url"}
    wp_url = homepage_url.rstrip("/") + "/wp-json/"
    wp_result = _fetch(wp_url)
    if wp_result["ok"] and 200 <= wp_result["status_code"] < 300:
        return {"ok": True, "detail": "wordpress"}
    # Fall back: check homepage contains <html
    hp_result = _fetch(homepage_url)
    if hp_result["ok"] and "<html" in hp_result["body"].lower():
        return {"ok": True, "detail": "html"}
    return {"ok": False, "detail": "unknown"}


def _check_dns(domain_record: dict) -> dict[str, Any]:
    """DNS check: only verify expected fields are present (no external DNS calls)."""
    has_ip = bool(domain_record.get("expected_ip"))
    has_url = bool(domain_record.get("homepage_url"))
    if has_ip and has_url:
        return {"ok": True, "detail": "fields_present"}
    if not has_ip:
        return {"ok": False, "detail": "missing_expected_ip"}
    return {"ok": False, "detail": "missing_homepage_url"}


def _score(homepage: dict, api: dict, dns: dict, domain_record: dict) -> tuple[int, str]:
    score = 0
    if homepage["ok"]:
        score += 30
    if api["ok"]:
        score += 30
    if dns["ok"]:
        score += 20
    # Artwork: 5 pts each
    for flag in ("has_logo", "has_favicon", "has_og_image", "has_masthead"):
        if domain_record.get(flag):
            score += 5

    if score >= 85:
        color = "green"
    elif score >= 60:
        color = "yellow"
    else:
        color = "red"

    return score, color


def check_domain(domain_record: dict) -> dict[str, Any]:
    """
    Run all health checks for a domain record dict.
    Returns health sub-dict suitable for embedding in API responses.
    """
    homepage = _check_homepage(domain_record.get("homepage_url"))
    api      = _check_api(domain_record.get("health_url"))
    cms      = _check_cms(domain_record.get("homepage_url"))
    dns      = _check_dns(domain_record)
    score, color = _score(homepage, api, dns, domain_record)

    return {
        "homepage": homepage,
        "api":      api,
        "cms":      cms,
        "dns":      dns,
        "score":    score,
        "color":    color,
    }
