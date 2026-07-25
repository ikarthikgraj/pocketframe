# Risk Register and Fallback Plan

## 1. Critical risks

| Risk | Impact | Early signal | Primary mitigation | Fallback |
|---|---|---|---|---|
| Video API unavailable | No generated clips | First smoke request fails | Test in first hour | Manual upload plus cached clips |
| Video queue too slow | Demo stalls | Job exceeds expected window | Never generate full trailer live | Cached version switch |
| FFmpeg render fails | No final output | Dummy render does not pass | Build stitcher before real media | Pre-rendered final plus direct concat script |
| TTS model access fails | No emotional voice | Credential or model error | Configurable model and mock adapter | Pre-generated TTS fixtures |
| Network failure | Live services unavailable | Connection instability | Local media and offline mode | Full cached workflow |

## 2. High risks

### Character inconsistency

Mitigation:

- Use one protagonist.
- Use one outfit.
- Use one primary environment.
- Upload the same character reference to every scene when supported.
- Avoid close facial dialogue.
- Repeat character lock block.

Fallback:

- Replace weak generated clips with environment/action shots.
- Use manual upload.

### Sparse synopsis

Mitigation:

- Label inferred details.
- Require approval.
- Keep narration exact.
- Avoid inventing named story events.

Fallback:

- Ask user to supply one visual note or cover/reference image.

### TTS emotion is flat or excessive

Mitigation:

- Voice audition.
- Specific performance direction.
- Scene-level regeneration.
- Lock one voice.

Fallback:

- Use the best pre-generated narration in cached mode.

### Duration mismatch

Mitigation:

- Measure approved audio, not estimated words.
- Add 1.2 seconds.
- Map to supported clip durations.
- Trim or freeze video, never distort voice.

Fallback:

- Split a scene and revalidate source reconstruction.

## 3. Medium risks

### Safety rejection

Mitigation:

- Non-graphic phrasing.
- No explicit injury details.
- No sexual content.
- Prompt sanitizer.

Fallback:

- Convert the shot to atmosphere, silhouette, reaction, or aftermath.

### Native SQLite package install problem

Mitigation:

- Test database package immediately.
- Keep repository interface small.

Fallback:

- Swap the repository implementation to a local JSON file without changing domain contracts.

### Codex scope expansion

Mitigation:

- Use AGENTS.md.
- One phase per task.
- Commit after every phase.
- Never ask for broad redesign.
- Stop after acceptance criteria pass.

Fallback:

- Revert to last passing commit and continue manually with the smallest missing function.

### Merge conflicts

Mitigation:

- One owner per module.
- Freeze contracts first.
- Avoid simultaneous edits to shared files.

## 4. Go/no-go gates

### Gate 1: First 60 minutes

Must prove:

- One emotional TTS file.
- One video result or confirmed manual upload path.
- One dummy FFmpeg render.

If TTS and render work but video does not, proceed with manual upload and cached media.

### Gate 2: Hour 6

Must prove:

- Project persists.
- Exact segmentation works.
- TTS approval gates shot action.

If not, drop real planner integration and use seeded planning output.

### Gate 3: Hour 12

Must prove:

- One scene completes the full flow from text to approved shot.
- Dummy full trailer renders.

If not, stop UI work and complete only the hero path.

### Gate 4: Final 4 hours

No architecture changes. Only:

- Bug fixes.
- Cached demo reliability.
- Final media.
- Presentation rehearsal.
