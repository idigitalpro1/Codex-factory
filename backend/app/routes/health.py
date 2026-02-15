from datetime import UTC, datetime

from flask import Blueprint, jsonify

health_bp = Blueprint("health", __name__)


@health_bp.get("/health")
def health_check():
    return jsonify(
        {
            "status": "ok",
            "service": "nextgen-factory-api",
            "timestamp": datetime.now(UTC).isoformat(),
        }
    )
