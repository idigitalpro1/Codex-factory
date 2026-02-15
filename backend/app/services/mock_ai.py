def run_mock_ai(prompt: str) -> dict:
    safe_prompt = (prompt or "").strip()

    if not safe_prompt:
        return {
            "provider": "mock-ai",
            "status": "ok",
            "input": "",
            "output": "No prompt supplied. Send JSON {\"prompt\": \"...\"}.",
        }

    return {
        "provider": "mock-ai",
        "status": "ok",
        "input": safe_prompt,
        "output": f"Mock insight: prioritize modular rollout for '{safe_prompt}'.",
    }
