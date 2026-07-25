# Codex Execution Plan for a Limited Credit Budget

## 1. Goal

Use Codex as a bounded implementation assistant, not as an autonomous product manager.

The credit balance must be protected from:

- Repeated full-repository scans.
- Broad architecture rewrites.
- Multiple agents editing the same files.
- Long speculative tasks.
- Repeated UI redesign.
- Debugging external provider access before smoke tests.

## 2. Budget allocation by effort

Use percentages because actual Codex consumption varies with model, context, and task size.

- 15 percent: repository foundation, database, and contracts.
- 20 percent: synopsis planning and TTS workflow.
- 20 percent: shot versioning, upload, and polling.
- 20 percent: FFmpeg rendering.
- 15 percent: integration tests and offline demo.
- 10 percent: final bug fixing reserve.

Do not spend the reserve on visual polish.

## 3. Model strategy

- Use the lowest-cost capable coding model for scaffolding, CRUD, types, UI cards, and tests.
- Use a stronger model only for media pipeline integration, FFmpeg debugging, or a difficult type/system issue.
- Do not use the strongest model for CSS adjustments or repetitive components.
- Keep each task narrow enough that Codex needs only relevant files.

## 4. Repository instructions

Put `AGENTS.md` in the repository root.

For every task, instruct Codex to:

1. Read AGENTS.md.
2. Inspect only files relevant to the current phase.
3. State a short plan.
4. Implement the smallest change.
5. Run typecheck and targeted tests.
6. Stop when the phase acceptance criteria pass.
7. Report changed files and remaining blockers.

## 5. Commit discipline

Create commits after:

- Foundation.
- Planning and segmentation.
- TTS workflow.
- Video workflow.
- Render pipeline.
- Offline demo.

If a Codex task makes the project worse, revert the commit. Do not ask another large task to repair a wide accidental refactor.

## 6. Task sequence

Use the prompts in `codex_tasks/` in order.

### Phase 1 - Foundation

Database, domain contracts, project create/list/open, seed mode.

### Phase 2 - Planning

Exact segmentation, reconstruction validation, mock planner, production bible UI.

### Phase 3 - TTS

Provider interface, Google adapter, mock adapter, ffprobe duration, voice approval.

### Phase 4 - Shots

Version records, provider interface, manual upload, polling, approve/reject.

### Phase 5 - Stitcher

Normalize, per-scene mux, concat, music, subtitles, final render.

### Phase 6 - Demo hardening

Seeded cached project, error states, smoke scripts, final tests.

## 7. Stop conditions

Do not ask Codex for the next phase unless:

- Typecheck passes.
- Existing tests pass.
- Current phase acceptance criteria pass.
- Work is committed.

Stop all new feature development when:

- The complete cached hero path works.
- Manual upload works.
- Final MP4 renders.

## 8. Efficient prompt pattern

Use:

```text
Read AGENTS.md and the current phase file. Inspect only the files needed for this phase. Do not redesign architecture. Implement the listed acceptance criteria, run targeted tests and typecheck, then stop. Report exact commands run and changed files.
```

Avoid:

```text
Build the entire AI trailer platform, make it production ready, improve the UX, and fix anything you find.
```

## 9. Human work that should not consume Codex

Do manually:

- Choosing the hero synopsis.
- Preparing reference images.
- Choosing the final video provider.
- Generating or uploading hero clips.
- Selecting background music.
- Rehearsing the pitch.
- Minor copy edits.

## 10. Final reserve

Keep at least 10 percent of the balance unused until the final integrated render has passed. The most valuable late use is a focused fix for one blocking integration issue, not another feature.
