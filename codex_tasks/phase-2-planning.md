# Phase 2 - Planning and Exact Segmentation

Read `AGENTS.md`, `PROMPT_LIBRARY.md`, and starter contracts.

Implement only:

- Exact synopsis segmentation.
- Exact normalized reconstruction validation.
- Zod planning schemas.
- StoryPlanner interface.
- Mock planner that uses seeded story bible and scenes.
- Real planner adapter behind configuration, using structured output.
- Analyze project endpoint.
- Setup step showing production bible and groundedness labels.
- Approve Production Bible action.

Constraints:

- The model may not rewrite narration text.
- Application supplies exact segments to the model.
- Max six scenes.
- Keep model identifier configurable.

Acceptance criteria:

- Unit tests prove exact reconstruction.
- Mock analyze flow persists scenes.
- Invalid planner output returns a structured error.
- Offline mode works without credentials.
- Typecheck, lint, and tests pass, then stop.
