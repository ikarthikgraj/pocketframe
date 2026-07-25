# Phase 1 - Foundation

Read `AGENTS.md`, `PRD.md`, `TRD.md`, `UI_SPEC.md`, and `db/schema.sql`.

Implement only:

- Next.js TypeScript scaffold if absent.
- SQLite connection and idempotent migration runner.
- Project, Scene, and SceneVersion repository functions.
- Project create, list, get, and update APIs.
- Project list page.
- Create Project page.
- Minimal project workspace shell with Setup, Voice, Shots, Export steps.
- Seed command that loads `seed/demo-project.json`.
- `.env.local` loading and config validation.

Constraints:

- No external AI calls.
- No TTS.
- No video provider.
- No FFmpeg rendering.
- No authentication.
- Keep UI plain and functional.

Acceptance criteria:

- Create a project and reopen it after server restart.
- Seed demo project.
- Typecheck, lint, and repository tests pass.
- Report changed files and exact commands run, then stop.
