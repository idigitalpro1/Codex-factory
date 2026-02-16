def run_mock_ai(prompt: str) -> dict:
    safe_prompt = (prompt or "").strip()

    if not safe_prompt:
        return {
            "provider": "mock-ai",
            "status": "ok",
            "input": "",
            "output": "No prompt supplied. Send JSON {\"prompt\": \"...\"}.",
        }

    prompt_for_output = safe_prompt.rstrip(".!?") or safe_prompt

    return {
        "provider": "mock-ai",
        "status": "ok",
        "input": safe_prompt,
        "output": f"Mock insight: prioritize modular rollout for '{prompt_for_output}'.",
    }
