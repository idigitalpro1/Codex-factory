from __future__ import annotations

import os

from flask import Blueprint, abort, jsonify, request

from app.services import kit_store as store

kits_bp = Blueprint("kits", __name__)

_ADMIN_KEY = os.environ.get("ADMIN_API_KEY", "codex-internal-2026")


def _require_admin() -> None:
    key = request.headers.get("X-Admin-Key", "")
    if key != _ADMIN_KEY:
        abort(403, description="Admin key required")


@kits_bp.get("/kits")
def list_kits():
    kits = store.list_kits()
    return jsonify({"kits": kits, "total": len(kits)})


@kits_bp.get("/kits/<kit_id>/status")
def kit_status(kit_id: str):
    kit = store.get_kit(kit_id)
    if not kit:
        abort(404, description="Kit not found")
    return jsonify(kit)


@kits_bp.post("/kits/import")
def import_kit():
    _require_admin()

    if "file" not in request.files:
        abort(400, description="file field required (multipart/form-data)")

    f = request.files["file"]
    if not f.filename:
        abort(400, description="No filename")
    if not f.filename.lower().endswith(".zip"):
        abort(400, description="Only .zip files accepted")

    try:
        kit = store.import_kit(f.read(), f.filename)
    except ValueError as exc:
        abort(400, description=str(exc))

    status = 201 if kit["validation"]["passed"] else 200
    return jsonify(kit), status


@kits_bp.post("/kits/<kit_id>/publish")
def publish_kit(kit_id: str):
    _require_admin()
    try:
        kit = store.publish_kit(kit_id)
    except KeyError as exc:
        abort(404, description=str(exc))
    except Exception as exc:
        abort(500, description=str(exc))
    return jsonify(kit)
