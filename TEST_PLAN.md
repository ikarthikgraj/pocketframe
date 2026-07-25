# Test Plan

## 1. Test strategy

Prioritize the exact workflow and failure recovery over broad coverage.

The required quality gates are:

- Unit tests pass.
- Typecheck passes.
- Lint passes.
- Offline end-to-end flow passes.
- One real TTS smoke test passes.
- One real video or manual upload path passes.
- Final MP4 renders and plays.

## 2. Unit tests

### Synopsis segmentation

- One sentence remains one segment.
- Multiple sentences remain in original order.
- Long sentence splits at an allowed boundary.
- Punctuation is preserved.
- Normalized reconstruction equals normalized source.
- Reconstruction failure throws before TTS.

### Duration mapping

- 3.0 second TTS maps to 6 second clip when supported durations are 4, 6, 8.
- 5.7 second TTS maps to 8 second clip.
- 7.2 second TTS plus 1.2 returns split required.
- Millisecond rounding is deterministic.

### State transitions

- Video generation is blocked before TTS approval.
- Rendering is blocked before all scenes are approved.
- Approving a new version unapproves the previous version.
- Rejecting one version leaves other scene state intact.

### Path safety

- Reject traversal paths.
- Accept expected local relative paths.
- Generate unique output names.

## 3. Integration tests

- Create project and retrieve it.
- Analyze project with mock planner.
- Generate mock TTS WAV and measure duration.
- Approve TTS and unlock video generation.
- Submit mock video job and poll until ready.
- Upload manual MP4 and create version.
- Approve version.
- Render final fixture trailer.

## 4. Offline end-to-end scenario

1. Seed demo project.
2. Open project workspace.
3. Approve production bible.
4. Play and approve all TTS fixtures.
5. Reject scene 3 version 1.
6. Approve scene 3 version 2.
7. Approve remaining scenes.
8. Upload optional music.
9. Render final trailer.
10. Refresh and verify COMPLETE state.

## 5. Real provider smoke tests

### Google TTS

Use one 10 to 15 word line and three performance directions:

- Neutral.
- Heartbroken.
- Ominous.

Pass condition:

- All files are returned.
- Audio plays.
- At least two performances are perceptibly different.
- ffprobe reports valid duration.

### Video provider

Use one approved reference image and one safe eight-second prompt.

Pass condition:

- Request submits.
- Job ID persists.
- Polling updates state.
- Result downloads.
- Result normalizes with FFmpeg.

## 6. Render verification

Check final output using ffprobe:

- Codec H.264.
- Audio AAC.
- Resolution 1080x1920 or approved preview resolution.
- Frame rate 24 fps.
- Pixel format yuv420p.
- Duration within one second of expected timeline.

Watch the full file once with headphones.

## 7. Demo readiness checklist

- Hero trailer stored locally.
- Backup trailer stored locally.
- Cached project database seeded.
- All provider toggles can be set to mock.
- Network can be disabled without breaking project view.
- Final video opens in browser and native player.
- Screen recording backup exists.
- Presentation machine has FFmpeg and required fonts.
