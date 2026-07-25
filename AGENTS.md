# AGENTS.md - PocketFrame Repository Rules

## Product

PocketFrame is a local-first hackathon MVP that converts an existing audio-show synopsis into an emotion-directed, human-approved cinematic trailer.

## Non-negotiable workflow

```text
Create project
-> Analyze synopsis
-> Preserve exact narration text
-> Generate and approve emotional TTS
-> Calculate shot duration
-> Generate or upload shot
-> Approve one version per scene
-> Stitch approved media
-> Export MP4
```

## Scope limits

- 6 to 7 test projects.
- 4 to 6 scenes per project.
- One narrator per project.
- At most two video versions per scene.
- One local SQLite database.
- Local filesystem media.
- One real video provider adapter.
- Mock and manual-upload fallbacks.
- FFmpeg stitcher.
- Minimal UI.

Do not add:

- Authentication.
- Payments.
- Supabase.
- Redis.
- Queues.
- Microservices.
- Vector databases.
- Multi-user collaboration.
- AI music generation.
- Lip sync.
- Marketplace features.
- Full timeline editing.
- Story analysis beyond the provided synopsis.

## Architecture

- Next.js App Router and TypeScript.
- Server route handlers for API endpoints.
- SQLite repository behind a small repository module.
- Zod for all external and AI contracts.
- Provider interfaces for planning, TTS, and video.
- FFmpeg and ffprobe invoked using child_process.spawn with argument arrays.
- External credentials remain server-side.

## Exact synopsis rule

The spoken narration must preserve the normalized original synopsis exactly.

Allowed normalization:

- Collapse whitespace.
- Trim leading and trailing whitespace.

Not allowed:

- Paraphrasing.
- Translation.
- Word insertion or deletion.
- Punctuation changes.
- Reordering.

Before TTS generation, reconstruct all scene exactText fields and compare them with the source synopsis. Throw a domain error on mismatch.

## TTS rule

- TTS is generated scene by scene.
- Emotional direction may change, exact text may not.
- Video generation is blocked until the scene TTS is approved.
- Measure audio duration with ffprobe.
- Required visual duration is audio duration plus 1.2 seconds.

## Video rule

- Every attempt creates a SceneVersion.
- Never overwrite a prior video file or version row.
- Manual upload is always supported.
- Only one version per scene is approved at a time.
- Rendering is blocked until every scene has an approved version.

## UI rule

Prioritize status, preview, and actions. No decorative dashboard work until the complete flow passes.

Required workspace steps:

- Setup.
- Voice.
- Shots.
- Export.

## Error rule

- Preserve prior valid state.
- Return structured domain errors.
- External timeouts are recoverable.
- No failed external operation may delete approved media.

## Testing rule

Every phase must include targeted tests.

Before completing a phase, run:

- Typecheck.
- Lint.
- Relevant unit/integration tests.

Do not continue to a later phase with failing tests.

## Codex behavior

For each task:

1. Read this file and the relevant phase file.
2. Inspect only relevant files.
3. Give a short implementation plan.
4. Make the smallest coherent change.
5. Run tests and typecheck.
6. Stop after acceptance criteria pass.
7. List changed files and blockers.

Do not perform broad refactors or switch libraries without explicit approval.

## Definition of done

- Cached hero project works offline.
- One real TTS smoke test works.
- Manual upload works.
- Scene approval and retry work.
- Final MP4 renders and plays.
- Project state survives restart.
- Exact source text validation is enforced.
