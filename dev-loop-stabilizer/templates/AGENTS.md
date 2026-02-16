# AGENTS Rules

Guardrails for human + AI contributions.

## Non-negotiables
- No secrets, keys, tokens, or credentials committed—ever.
- No port changes unless conflict is proven with `lsof`.
- No sudo unless a human explicitly asks.

## Local dev standards
- Provide `make up/down/status/health`.
- PID files must represent **real listeners** (validated via `lsof`).
- Document canonical URLs in `docs/SOURCE_OF_TRUTH.md`.

## Change discipline
- Minimal diffs.
- No unrelated refactors during stabilization.
- Update docs when behavior changes.
