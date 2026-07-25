# Phase 4 - Shot Versions and Review

Read `AGENTS.md`, `API_AND_DATA_CONTRACTS.md`, and `RISK_REGISTER.md`.

Implement only:

- VideoProvider interface.
- Mock provider with deterministic queued, generating, ready states.
- Manual MP4 upload path.
- One placeholder real-provider adapter with documented TODO fields if credentials or provider are not yet selected.
- SceneVersion repository functions.
- Generate video endpoint.
- Five-second status polling endpoint and client behavior.
- Shot scene cards.
- Approve, reject, retry, and version history.
- Media file type, size, and path validation.

Constraints:

- At most two provider-generated versions per scene.
- Manual upload remains available.
- Do not implement final render.
- Do not add background workers or Redis.

Acceptance criteria:

- A mock job reaches READY.
- A manual upload creates a reviewable version.
- Approving version 2 unapproves version 1.
- A failed scene does not affect other scenes.
- Typecheck, lint, and tests pass, then stop.
