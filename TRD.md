# Technical Requirements Document: PocketFrame

Version: 1.0 Hackathon MVP
Architecture style: Local-first modular monolith
Primary runtime: Node.js with Next.js App Router
Persistence: SQLite plus local filesystem
Media assembly: FFmpeg and ffprobe

## 1. Technical objective

Implement the smallest reliable system that supports:

- Synopsis ingestion.
- Structured production planning.
- Exact-text narration segmentation.
- Emotion-directed Google TTS.
- TTS review and approval.
- Duration-aware video prompt creation.
- Asynchronous video generation or manual upload.
- Shot versioning and approval.
- Final trailer assembly.
- Offline cached demo mode.

The design optimizes for a 20-hour build and a limited Codex budget. It intentionally avoids distributed infrastructure.

## 2. Architecture decision summary

| Decision | Choice | Reason |
|---|---|---|
| Application | Next.js TypeScript monolith | One codebase for UI and API routes |
| UI | Minimal server/client components | Fast implementation and low surface area |
| Database | SQLite | Sufficient for 6 to 7 projects, no service setup |
| Media storage | Local filesystem | Avoid object-storage integration |
| AI planning | Structured JSON from an LLM | Predictable contracts and validation |
| TTS | Google Gemini-TTS provider adapter | Emotion, tone, pace, and style direction |
| Video | One real adapter plus mock and manual upload | Avoid provider lock-in and demo failure |
| Jobs | Persist provider job ID and poll | No Redis or worker service needed |
| Stitching | FFmpeg command pipeline | Smallest dependable media path |
| Offline mode | Seeded SQLite records plus cached media | Demo must not depend on external latency |

## 3. System context

```text
Browser
  |
  | HTTP
  v
Next.js application
  |-- Project and review UI
  |-- Route handlers
  |-- Domain services
  |-- Provider adapters
  |-- SQLite repository
  |-- Local media repository
  |
  |-- OpenAI-compatible story planner
  |-- Google TTS
  |-- Video generation provider
  |-- FFmpeg / ffprobe processes
```

## 4. Major modules

### 4.1 Project service

Responsibilities:

- Create and update projects.
- Validate synopsis limits.
- Manage project state.
- Return project workspace data.

### 4.2 Planning service

Responsibilities:

- Generate story bible.
- Generate visual bible.
- Generate voice bible.
- Create scene-level emotional direction.
- Generate video prompts.
- Enforce structured schemas.

### 4.3 Synopsis segmentation service

Responsibilities:

- Split the exact synopsis into ordered segments.
- Preserve punctuation and word order.
- Split long sentences only at safe clause boundaries.
- Validate exact normalized reconstruction.
- Cap final scene count at six for the MVP.

### 4.4 TTS service

Responsibilities:

- Build a performance prompt from voice bible and scene direction.
- Generate TTS per scene.
- Save audio locally.
- Measure audio duration using ffprobe.
- Persist status and duration.
- Support preview versus final quality through configuration.

### 4.5 Video service

Responsibilities:

- Build provider input.
- Submit generation.
- Save provider job ID.
- Poll generation status.
- Download completed video locally.
- Accept manual upload.
- Preserve scene versions.

### 4.6 Review service

Responsibilities:

- Approve or reject TTS.
- Approve or reject a scene video version.
- Create retries without deleting previous versions.
- Enforce readiness rules.

### 4.7 Render service

Responsibilities:

- Normalize videos.
- Fit each clip to approved audio duration plus breathing room.
- Mix narration with optional music.
- Burn subtitles when enabled.
- Add title and CTA card.
- Concatenate scene outputs.
- Save final MP4 path.

## 5. Recommended repository structure

```text
app/
  page.tsx
  projects/
    new/page.tsx
    [projectId]/page.tsx
  api/
    projects/route.ts
    projects/[projectId]/route.ts
    projects/[projectId]/analyze/route.ts
    projects/[projectId]/render/route.ts
    scenes/[sceneId]/tts/route.ts
    scenes/[sceneId]/approve-tts/route.ts
    scenes/[sceneId]/video/route.ts
    scenes/[sceneId]/upload/route.ts
    scene-versions/[versionId]/status/route.ts
    scene-versions/[versionId]/approve/route.ts
    scene-versions/[versionId]/reject/route.ts
components/
  project-form.tsx
  workspace-stepper.tsx
  production-bible.tsx
  voice-scene-card.tsx
  shot-scene-card.tsx
  export-panel.tsx
lib/
  db/
    connection.ts
    migrate.ts
    repositories.ts
  domain/
    contracts.ts
    states.ts
    errors.ts
  planning/
    planner.ts
    schemas.ts
    prompts.ts
  synopsis/
    segment.ts
    validate.ts
  tts/
    provider.ts
    google-provider.ts
    mock-provider.ts
    duration.ts
  video/
    provider.ts
    real-provider.ts
    mock-provider.ts
    manual-provider.ts
  media/
    files.ts
    ffmpeg.ts
    subtitles.ts
  config.ts
scripts/
  check-prerequisites.sh
  seed-demo.ts
  render-demo.ts
data/
  pocketframe.sqlite
  projects/
seed/
  demo-project.json
  mock-story-bible.json
  mock-scenes.json
```

## 6. Persistence design

Use one SQLite database file and three domain tables.

Media binaries must not be stored in SQLite. Persist relative file paths.

### Projects

Stores show input, bibles, project status, and final output path.

### Scenes

Stores exact narration text, emotion direction, TTS state, visual plan, target duration, and approved video version ID.

### Scene versions

Stores every generated or uploaded video attempt.

The canonical SQL is in `db/schema.sql`.

## 7. Filesystem layout

```text
data/projects/{projectId}/
  input/
    cover.png
    reference-01.png
  audio/
    scene-01-v1.wav
    scene-01-v2.wav
  videos/
    scene-01-v1-original.mp4
    scene-01-v1-normalized.mp4
  renders/
    final-v1.mp4
  temp/
    concat.txt
    subtitles.srt
```

All paths stored in SQLite are relative to the repository media root.

## 8. Domain state rules

### Project transition rules

```text
DRAFT -> ANALYZING -> BIBLE_READY -> VOICE_REVIEW
VOICE_REVIEW -> SHOT_GENERATION when all TTS is approved
SHOT_GENERATION -> SHOT_REVIEW when at least one shot is ready
SHOT_REVIEW -> READY_TO_RENDER when every scene has an approved version
READY_TO_RENDER -> RENDERING -> COMPLETE
Any external step may enter FAILED with a recoverable error
```

### Scene transition rules

```text
DRAFT -> TTS_READY -> TTS_APPROVED
TTS_APPROVED -> VIDEO_READY -> VIDEO_QUEUED -> VIDEO_GENERATING
VIDEO_GENERATING -> VIDEO_REVIEW
VIDEO_REVIEW -> APPROVED
Any generation state -> FAILED
FAILED -> previous ready state after retry
```

Enforce transitions in domain service functions, not only in UI controls.

## 9. AI planning contracts

The story planner returns one structured object containing:

- StoryBible.
- VisualBible.
- VoiceBible.
- SceneDirections.

The planner must not rewrite scene narration. The application supplies exact segments and requests only annotations.

All planner output must be parsed through Zod. Invalid output is retried once with the validation error. A second failure returns a user-visible error and preserves the project.

## 10. Exact synopsis preservation

### Normalization rule

Normalize only whitespace:

```text
- Replace consecutive whitespace with one space.
- Trim leading and trailing whitespace.
- Do not change punctuation, capitalization, spelling, or word order.
```

### Validation rule

```text
normalize(scene1.exactText + " " + ... + sceneN.exactText)
=== normalize(project.synopsis)
```

Block TTS generation if validation fails.

### Segmentation approach

1. Use `Intl.Segmenter` with sentence granularity.
2. Group sentences while estimated duration remains below provider limit.
3. If a sentence is too long, split only after commas, semicolons, colons, em dashes converted from source spacing, or coordinating conjunction boundaries.
4. Preserve the original characters in the segment.
5. Re-run exact reconstruction validation.

For the hero demo, select a synopsis that naturally produces 4 to 6 scenes.

## 11. Voice direction and TTS

### Voice bible fields

- languageCode.
- providerVoice.
- narratorPersona.
- accent.
- timbre.
- baselinePace.
- baselineStylePrompt.

### Scene direction fields

- emotion.
- intensity 1 to 10.
- pace.
- energy.
- endingStyle.
- deliveryPrompt.
- pauseGuidance.

### Performance prompt assembly

Combine:

1. Global voice identity.
2. Global delivery constraints.
3. Scene emotion and intensity.
4. Scene performance direction.
5. Exact-text rule.

Example constraint:

"Speak only the supplied narration text. Do not speak the instructions. Do not add, remove, paraphrase, or translate any words."

### TTS versioning

The database stores the currently selected TTS path on the scene. Previous TTS files can remain on disk but do not require a fourth table for the MVP. Each regeneration increments the filename version.

### Duration measurement

Run:

```bash
ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 INPUT.wav
```

Persist milliseconds as an integer.

## 12. Video duration mapping

```text
requiredSeconds = ttsSeconds + 1.2
```

For a provider with fixed durations:

```text
choose the smallest supported duration >= requiredSeconds
```

If no supported duration exists:

- Return a split-required status.
- Split the scene at a safe boundary.
- Revalidate exact reconstruction.
- Regenerate only affected scene directions.

Do not automatically accelerate narration to fit a clip.

## 13. Provider interfaces

### Story planner

```ts
interface StoryPlanner {
  analyze(input: PlanningInput): Promise<PlanningResult>;
}
```

### TTS provider

```ts
interface TtsProvider {
  synthesize(input: TtsRequest): Promise<{
    audioPath: string;
    providerRequestId?: string;
  }>;
}
```

### Video provider

```ts
interface VideoProvider {
  submit(input: VideoRequest): Promise<{ providerJobId: string }>;
  getStatus(providerJobId: string): Promise<VideoJobStatus>;
  download(providerJobId: string, targetPath: string): Promise<void>;
}
```

The manual upload path bypasses submit and polling but still creates a SceneVersion record.

## 14. Video prompt composition

Every prompt is assembled from fixed blocks:

1. Shot action.
2. Character lock.
3. Environment lock.
4. Mood and lighting.
5. Camera movement.
6. Duration and pacing.
7. Visual quality.
8. Negative constraints.

Keep one motivated camera movement per shot. Avoid lip sync, crowds, complex hand interaction, age transformation, and multi-character combat in the MVP.

## 15. Asynchronous job flow

1. UI calls `POST /api/scenes/{id}/video`.
2. Server validates TTS approval.
3. Server creates SceneVersion with status QUEUED.
4. Server submits provider request.
5. Server saves provider job ID.
6. UI polls `GET /api/scene-versions/{id}/status` every five seconds.
7. Status route asks the provider for current state.
8. On completion, server downloads media and updates the version to READY.
9. UI stops polling.

No background worker is required for 6 to 7 projects.

## 16. Manual upload fallback

Manual upload is mandatory, not optional.

Accepted format:

- MP4.
- Maximum 100 MB for the MVP.
- H.264 preferred.

The server saves the original file, creates a SceneVersion with provider `manual`, and normalizes it before preview or render.

## 17. Media normalization

Before final assembly, every video must be normalized to the same:

- Resolution: 1080x1920 final; 720x1280 preview permitted.
- Frame rate: 24 fps.
- Video codec: H.264.
- Pixel format: yuv420p.
- Audio: removed from scene source clips.

Illustrative command:

```bash
ffmpeg -y -i INPUT.mp4 \
  -vf "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=24,format=yuv420p" \
  -an -c:v libx264 -preset fast OUTPUT.mp4
```

## 18. Per-scene assembly

For each scene:

1. Trim video to `ttsDuration + 1.2 seconds`.
2. If source video is shorter, freeze the last frame.
3. Add 0.2 seconds visual lead before speech when possible.
4. Mix narration.
5. Burn scene subtitle if subtitles are enabled.
6. Output a normalized scene MP4.

## 19. Final assembly

1. Generate a concat manifest in scene order.
2. Concatenate normalized scene MP4 files.
3. Add optional background music.
4. Duck music under narration.
5. Append title/CTA card or overlay it in the final scene.
6. Output H.264/AAC MP4.

The concat demuxer requires compatible streams, so normalization happens first.

Use hard cuts for the first implementation. Add 200 to 300 millisecond fades only after the core pipeline passes.

## 20. API surface

Detailed request and response contracts are in `API_AND_DATA_CONTRACTS.md`.

Required endpoints:

- POST `/api/projects`
- GET `/api/projects`
- GET `/api/projects/{projectId}`
- POST `/api/projects/{projectId}/analyze`
- POST `/api/scenes/{sceneId}/tts`
- POST `/api/scenes/{sceneId}/approve-tts`
- POST `/api/scenes/{sceneId}/video`
- POST `/api/scenes/{sceneId}/upload`
- GET `/api/scene-versions/{versionId}/status`
- POST `/api/scene-versions/{versionId}/approve`
- POST `/api/scene-versions/{versionId}/reject`
- POST `/api/projects/{projectId}/render`
- GET `/api/projects/{projectId}/render-status`

## 21. Error handling

Every external operation returns a structured error:

```json
{
  "code": "VIDEO_PROVIDER_TIMEOUT",
  "message": "The shot is still processing. Try status again.",
  "retryable": true,
  "details": {}
}
```

Required codes:

- INVALID_SYNOPSIS
- PLANNER_OUTPUT_INVALID
- TTS_PROVIDER_ERROR
- TTS_DURATION_INVALID
- VIDEO_ACCESS_DENIED
- VIDEO_PROVIDER_TIMEOUT
- VIDEO_PROVIDER_REJECTED
- MEDIA_FORMAT_UNSUPPORTED
- FFMPEG_NOT_FOUND
- RENDER_FAILED
- PROJECT_NOT_READY

Do not erase prior valid state on failure.

## 22. Configuration

All provider names, models, file roots, limits, and timeouts must be environment variables. Do not hardcode model identifiers in UI components.

The canonical environment template is `.env.example`.

## 23. Security

- API keys stay in server runtime only.
- Reject file paths containing traversal sequences.
- Generate server-side UUIDs for project and media paths.
- Limit file size and MIME type.
- Do not execute user-provided shell strings.
- Build FFmpeg arguments as arrays passed to `spawn`, not concatenated shell commands.

## 24. Observability

Use structured console logs with:

- projectId.
- sceneId.
- operation.
- provider.
- durationMs.
- status.
- requestId when available.

Persist human-visible timestamps and error messages in the database only when useful for recovery.

## 25. Testing requirements

### Unit

- Exact synopsis reconstruction.
- Scene duration mapping.
- State transition guards.
- Prompt composition.
- File path sanitization.

### Integration

- Project create/read/update.
- Mock planner.
- Mock TTS generation plus ffprobe.
- Manual upload and normalization.
- Mock video polling.
- Final FFmpeg render using fixtures.

### End-to-end

- Seeded project from create to final render.
- Refresh at every workflow step.
- Reject and replace one shot.
- Offline mode with no API credentials.

## 26. Local execution

Required local tools:

- Node.js.
- npm or pnpm.
- FFmpeg.
- ffprobe.
- Google Cloud credentials for real TTS.
- LLM API credential for real planning.
- Video provider credential only if real generation is enabled.

The application must still boot when external credentials are absent and `OFFLINE_DEMO_MODE=true`.

## 27. Definition of done

The build is done when:

- One command starts the app.
- One command seeds the offline demo.
- One command renders the cached final trailer.
- The hero project can be re-opened after restart.
- Exact synopsis validation is enforced.
- TTS approval gates video generation.
- Shot approval gates rendering.
- Manual upload works.
- Final MP4 plays locally.
- Typecheck, lint, and automated tests pass.
