# Phase 3 - Emotional TTS and Approval

Read `AGENTS.md`, `TRD.md` sections 10 to 12, and `PROMPT_LIBRARY.md`.

Implement only:

- TtsProvider interface.
- Mock TTS provider that writes valid fixture WAV files.
- Google Gemini-TTS adapter behind environment configuration.
- Performance prompt builder.
- Scene TTS endpoint.
- ffprobe duration measurement.
- Duration selection logic.
- Voice scene cards with generate, play, edit direction, regenerate, and approve.
- TTS approval endpoint and state guard.

Constraints:

- Exact narration text is read-only.
- Video actions do not exist yet.
- Do not hardcode provider model names.
- Provider errors must not delete prior audio.

Acceptance criteria:

- Mock TTS path works end to end.
- One optional real TTS smoke script is documented.
- ffprobe duration is persisted.
- Video readiness remains locked until approval.
- Typecheck, lint, and tests pass, then stop.
