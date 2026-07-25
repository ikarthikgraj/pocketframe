# API and Data Contracts

All request and response bodies are JSON unless the endpoint accepts multipart media upload.

## 1. Status enums

```ts
type ProjectStatus =
  | "DRAFT"
  | "ANALYZING"
  | "BIBLE_READY"
  | "VOICE_REVIEW"
  | "SHOT_GENERATION"
  | "SHOT_REVIEW"
  | "READY_TO_RENDER"
  | "RENDERING"
  | "COMPLETE"
  | "FAILED";

type SceneStatus =
  | "DRAFT"
  | "TTS_READY"
  | "TTS_APPROVED"
  | "VIDEO_READY"
  | "VIDEO_QUEUED"
  | "VIDEO_GENERATING"
  | "VIDEO_REVIEW"
  | "APPROVED"
  | "FAILED";

type VersionStatus =
  | "QUEUED"
  | "GENERATING"
  | "READY"
  | "APPROVED"
  | "REJECTED"
  | "FAILED";
```

## 2. Create project

`POST /api/projects`

Request:

```json
{
  "title": "The Last Voice Note",
  "synopsis": "Exact source synopsis text...",
  "genre": "Romantic thriller",
  "languageCode": "en-IN"
}
```

Response:

```json
{
  "project": {
    "id": "uuid",
    "title": "The Last Voice Note",
    "status": "DRAFT"
  }
}
```

## 3. List projects

`GET /api/projects`

Response:

```json
{
  "projects": [
    {
      "id": "uuid",
      "title": "The Last Voice Note",
      "status": "VOICE_REVIEW",
      "approvedScenes": 2,
      "totalScenes": 5,
      "updatedAt": "ISO timestamp"
    }
  ]
}
```

## 4. Analyze project

`POST /api/projects/{projectId}/analyze`

Request:

```json
{
  "maxScenes": 6,
  "providerMode": "real"
}
```

Response:

```json
{
  "projectId": "uuid",
  "status": "BIBLE_READY",
  "storyBible": {},
  "visualBible": {},
  "voiceBible": {},
  "scenes": []
}
```

## 5. Generate TTS

`POST /api/scenes/{sceneId}/tts`

Request:

```json
{
  "deliveryPrompt": "Begin with restrained warmth...",
  "quality": "preview"
}
```

Response:

```json
{
  "sceneId": "uuid",
  "ttsPath": "projects/.../audio/scene-01-v1.wav",
  "ttsDurationMs": 6230,
  "targetVideoDurationMs": 8000,
  "status": "TTS_READY"
}
```

## 6. Approve TTS

`POST /api/scenes/{sceneId}/approve-tts`

Request:

```json
{
  "approved": true
}
```

Response:

```json
{
  "sceneId": "uuid",
  "status": "TTS_APPROVED"
}
```

## 7. Generate video

`POST /api/scenes/{sceneId}/video`

Request:

```json
{
  "prompt": "Final editable prompt...",
  "provider": "real"
}
```

Response:

```json
{
  "version": {
    "id": "uuid",
    "versionNumber": 1,
    "providerJobId": "external-id",
    "status": "QUEUED"
  }
}
```

## 8. Poll video status

`GET /api/scene-versions/{versionId}/status`

Response while processing:

```json
{
  "id": "uuid",
  "status": "GENERATING",
  "elapsedMs": 85000
}
```

Response when ready:

```json
{
  "id": "uuid",
  "status": "READY",
  "videoPath": "projects/.../videos/scene-01-v1-original.mp4"
}
```

## 9. Upload replacement

`POST /api/scenes/{sceneId}/upload`

Content type: `multipart/form-data`

Fields:

- file.
- prompt optional.

Response creates a version with provider `manual`.

## 10. Approve version

`POST /api/scene-versions/{versionId}/approve`

Response:

```json
{
  "versionId": "uuid",
  "sceneId": "uuid",
  "status": "APPROVED"
}
```

Approval rules:

- Only one version per scene may be approved.
- Approving a new version unapproves the prior version in one transaction.
- Scene `approved_version_id` is updated.

## 11. Reject version

`POST /api/scene-versions/{versionId}/reject`

Request:

```json
{
  "reason": "Character face changed and environment is too bright."
}
```

## 12. Render trailer

`POST /api/projects/{projectId}/render`

Request:

```json
{
  "subtitles": true,
  "title": "The Last Voice Note",
  "cta": "Listen now on Pocket FM",
  "musicPath": null,
  "preview": false
}
```

Response:

```json
{
  "projectId": "uuid",
  "status": "RENDERING"
}
```

## 13. Render status

`GET /api/projects/{projectId}/render-status`

Response:

```json
{
  "status": "COMPLETE",
  "finalRenderPath": "projects/.../renders/final-v1.mp4",
  "durationMs": 43800
}
```

## 14. Error contract

```json
{
  "error": {
    "code": "PROJECT_NOT_READY",
    "message": "Approve narration and one video version for every scene before rendering.",
    "retryable": false,
    "details": {
      "missingSceneIds": ["uuid"]
    }
  }
}
```

## 15. Planning data contract

```ts
type SourceLabel = "FROM_SYNOPSIS" | "AI_INFERRED" | "USER_EDITED" | "APPROVED";

interface Character {
  name: string;
  role: string;
  ageRange?: string;
  appearance: string;
  wardrobe: string;
  personality: string;
  source: SourceLabel;
}

interface Environment {
  name: string;
  description: string;
  timePeriod: string;
  lighting: string;
  weather?: string;
  source: SourceLabel;
}

interface VoiceBible {
  languageCode: string;
  providerVoice: string;
  narratorPersona: string;
  accent: string;
  timbre: string;
  baselinePace: string;
  baselineStylePrompt: string;
}

interface SceneDirection {
  sceneNumber: number;
  exactText: string;
  purpose: "HOOK" | "CHARACTER" | "WORLD" | "CONFLICT" | "ESCALATION" | "CLIFFHANGER";
  emotion: string;
  intensity: number;
  pace: string;
  energy: string;
  endingStyle: string;
  deliveryPrompt: string;
  visualDescription: string;
  videoPrompt: string;
  negativePrompt: string;
  synopsisEvidence: string;
}
```
