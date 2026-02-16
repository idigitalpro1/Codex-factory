# Changelog

## v0.2.1
- ports.env persistence + conflict renegotiation
- listener-authoritative PID handling (no wrapper drift)
- node-vite dependency handling + offline-friendly messaging
- richer make health diagnostics (listener + log tail on fail)
- fixtures for proof/acceptance runs

## v0.2.0
- Added Node/Vite adapter template: `templates/Makefile.node-vite`.
- Added Node/Vite README snippet: `templates/README_SNIPPET.node-vite.md`.
- Added shared `templates/ports.env.example`.
- Added mac-compatible port picker: `bin/portpick.sh`.
- Added persistent port negotiation via `ports.env` across templates.
- Updated installer to support modes: `python`, `node-vite`, `mixed`.

## v0.1.0
- Initial release of Dev Loop Stabilizer Kit.
- Templates: Makefile lifecycle + protocol docs + README snippet.
- `apply-stabilizer.sh` installer.
- CI enforcement workflow.
- Playbook: constraints + validation + triage.
