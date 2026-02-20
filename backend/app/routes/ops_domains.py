from __future__ import annotations

from flask import Blueprint, abort, jsonify, request

from app.services import ops_domain_store as store

ops_domains_bp = Blueprint("ops_domains", __name__)

_URL_FIELDS = {"homepage_url", "health_url"}


def _valid_url(value: str) -> bool:
    return value.startswith("http://") or value.startswith("https://")


def _valid_domain(value: str) -> bool:
    return "." in value and " " not in value


@ops_domains_bp.get("/admin/ops/domains")
def list_domains():
    try:
        limit  = int(request.args.get("limit", 20))
        offset = int(request.args.get("offset", 0))
    except ValueError:
        abort(400, description="limit and offset must be integers")

    if limit < 0 or offset < 0:
        abort(400, description="limit and offset must not be negative")

    domains, total = store.list_domains(limit=limit, offset=offset)
    has_more = offset + limit < total
    result = {
        "total":   total,
        "count":   len(domains),
        "limit":   limit,
        "offset":  offset,
        "has_more": has_more,
        "domains": domains,
    }
    if has_more:
        result["next_offset"] = offset + limit
    return jsonify(result)


@ops_domains_bp.post("/admin/ops/domains")
def create_domain():
    data = request.get_json(silent=True) or {}

    domain = data.get("domain", "").strip()
    if not domain:
        abort(400, description="domain is required")
    if not _valid_domain(domain):
        abort(400, description="domain must be a valid domain name")

    for field in _URL_FIELDS:
        if field in data and data[field] and not _valid_url(data[field]):
            abort(400, description=f"{field} must start with http:// or https://")

    try:
        row = store.create_domain(data)
    except Exception:
        abort(409, description="domain already exists")

    return jsonify(row), 201


@ops_domains_bp.patch("/admin/ops/domains/<domain_id>")
def update_domain(domain_id: str):
    data = request.get_json(silent=True) or {}

    for field in _URL_FIELDS:
        if field in data and data[field] and not _valid_url(data[field]):
            abort(400, description=f"{field} must start with http:// or https://")

    row = store.update_domain(domain_id, data)
    if row is None:
        abort(404, description="Domain not found")
    return jsonify(row)
