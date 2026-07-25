# Minimal UI Specification

## 1. Design principle

The interface is a production checklist, not a creative design tool.

Optimize for:

- Clear current status.
- Immediate media preview.
- One primary action per step.
- Visible errors and recovery.
- Minimal navigation.

Avoid:

- Decorative dashboards.
- Complex charts.
- Drag-and-drop editing timelines.
- Excess animation.
- Modal-heavy workflows.
- Large blocks of AI-generated prose.

## 2. Visual system

- Background: white or near-white.
- Text: near-black.
- Borders: neutral gray.
- One accent color for primary actions and approved state.
- Red only for rejected or failed state.
- Rounded corners: small.
- Shadows: none or minimal.
- Font: system sans-serif.
- Max content width: 1200 px.

## 3. Routes

### `/`

Project list and Create Project button.

Each project row shows:

- Title.
- Status.
- Scene completion count.
- Updated time.
- Open action.

### `/projects/new`

Fields:

- Title.
- Synopsis.
- Genre.
- Language.
- Cover/reference upload.

Actions:

- Create Project.
- Load Demo Project.

### `/projects/{projectId}`

One workspace route with four horizontal or vertical steps:

1. Setup.
2. Voice.
3. Shots.
4. Export.

Do not create separate deep route trees unless required.

## 4. Workspace layout

```text
+--------------------------------------------------------------+
| PocketFrame | Show title | Project status                    |
+--------------------------------------------------------------+
| Setup | Voice | Shots | Export                               |
+--------------------------------------------------------------+
| Main content area                                            |
|                                                              |
|                                                              |
+--------------------------------------------------------------+
| Persistent footer: progress summary and next action          |
+--------------------------------------------------------------+
```

## 5. Setup step

Left column:

- Original synopsis, always visible and read-only after analysis unless reset.
- Cover/reference image thumbnails.

Right column:

- Premise.
- Characters.
- Environments.
- Mood.
- Visual direction.
- Groundedness labels.

Primary action:

- Approve Production Bible.

Secondary action:

- Edit Inferred Details.

## 6. Voice step

Render one compact card per scene.

```text
Scene 01 - Hook                         TTS APPROVED
Exact narration text

Emotion: Controlled dread     Intensity: 7
Pace: Slow                    Ending: Near whisper

Performance direction [editable textarea]

[Generate / Regenerate] [Play] [Approve Voice]
Duration: 6.2 sec       Planned visual: 8 sec
```

Rules:

- Exact narration is not editable in this step.
- Editing direction does not alter text.
- Approve button is disabled until an audio file exists.
- Approved cards collapse by default but remain playable.

## 7. Shots step

Render one card per scene.

```text
Scene 01 - Hook                         VERSION 2 APPROVED
[Video preview]
[Play with narration]

Prompt [editable textarea]
References: cover.png, mansion.png
Version history: v1 rejected, v2 ready

[Generate] [Upload] [Reject] [Approve Shot]
```

Rules:

- Generate is disabled until TTS is approved.
- At most two provider-generated versions in the MVP.
- Manual upload remains enabled after provider failure.
- Version history is a small list, not a complex comparison view.

## 8. Export step

Show:

- Readiness checklist.
- Scene order.
- Total duration.
- Optional music upload.
- Subtitle toggle.
- Title.
- CTA.

Primary action:

- Stitch Trailer.

After rendering:

- Final video player.
- Download button.
- Open output folder action for local mode.

## 9. Status language

Use simple labels:

- Not started.
- Generating.
- Ready for review.
- Approved.
- Rejected.
- Failed.

Do not expose internal enum names directly to users.

## 10. Loading behavior

- Never block the entire project page for a scene operation.
- Disable only the affected action.
- Show elapsed time for video jobs.
- Poll every five seconds.
- Provide Stop Polling and Check Again after two minutes.

## 11. Accessibility and keyboard

- Native buttons and form elements.
- Visible focus states.
- Space or Enter controls playback actions where appropriate.
- Status is communicated with text, not color alone.
- All inputs have labels.

## 12. UI acceptance criteria

- A first-time judge can identify the current step in under five seconds.
- The user can find the exact synopsis text at all times.
- The user can approve voice and shot without opening a modal.
- The system visibly prevents rendering before required approvals.
- The final player is reachable in four or fewer primary navigation actions.
