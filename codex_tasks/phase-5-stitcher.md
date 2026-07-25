# Phase 5 - FFmpeg Stitcher

Read `AGENTS.md`, `TRD.md` sections 17 to 19, and `TEST_PLAN.md`.

Implement only:

- FFmpeg and ffprobe process wrapper using spawn argument arrays.
- Video normalization.
- Per-scene trim or final-frame freeze.
- Narration mux.
- Optional subtitle burn-in.
- Optional background music with conservative volume under narration.
- Hard-cut concatenation.
- Title and CTA card.
- Render endpoint and status.
- Export step and final player.
- Render fixture integration test.

Constraints:

- Rendering is blocked until all scenes have approved TTS and video.
- Hard cuts first. No advanced transitions.
- Do not use Remotion unless FFmpeg cannot satisfy the acceptance criteria.

Acceptance criteria:

- Cached fixture project renders a valid MP4.
- Output is vertical H.264 with AAC audio.
- Duration is within one second of expected.
- Final video plays in browser.
- Typecheck, lint, and tests pass, then stop.
