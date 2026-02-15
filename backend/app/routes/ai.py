from flask import Blueprint, jsonify, request

from ..services.mock_ai import run_mock_ai

ai_bp = Blueprint("ai", __name__)


@ai_bp.post("/ai/mock")
def mock_ai():
    payload = request.get_json(silent=True) or {}
    prompt = payload.get("prompt", "")

    return jsonify(run_mock_ai(prompt=prompt))
