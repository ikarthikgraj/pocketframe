# Product Requirements Document: PocketFrame

Version: 1.0 Hackathon MVP
Status: Scope locked
Primary user: Pocket FM content producer or creative operations user
Primary business outcome: Increase the number of shows that can receive high-quality visual previews while reducing manual trailer-production effort

## 1. Product summary

PocketFrame is an end-to-end AI-assisted trailer production workflow for existing serialized audio shows. A producer enters the title and short synopsis already available for a show. PocketFrame derives the characters, environments, mood, visual direction, and emotional narration direction. It then generates scene-specific TTS, calculates scene duration from the approved voice performance, prepares video prompts, manages generated or uploaded shot versions, and stitches approved shots into a final trailer.

PocketFrame is not positioned as a generic one-click video generator. Its value is the controlled production workflow:

- Synopsis groundedness.
- Emotion-directed voice performance.
- Exact source-text preservation.
- Scene-level preview and approval.
- Retry and version history.
- Duration-aware video planning.
- Automated final assembly.

## 2. Problem

Pocket FM can represent a show with a title, cover, and short synopsis, but producing a visual trailer for each show traditionally requires creative interpretation, narration, storyboarding, video creation, review, and editing. Manual production does not scale evenly across a large catalog.

A generic text-to-video tool does not solve the full problem because it does not:

- Understand the synopsis as a coherent production brief.
- Preserve the same characters and environments across shots.
- Direct the narrator's emotional performance.
- Match shot duration to actual approved audio.
- Let a producer approve or retry individual shots.
- Assemble only approved versions into a final trailer.

## 3. Product proposition

PocketFrame turns existing catalog metadata into a reviewable production line.

One-line pitch:

"PocketFrame transforms an existing audio-show synopsis into an emotion-directed, human-approved cinematic trailer."

Business-focused pitch:

"Pocket FM already owns the stories. PocketFrame converts the title, cover, and synopsis already attached to each show into scalable promotional trailers for show pages, social media, and acquisition campaigns."

## 4. Target users

### Primary user

Pocket FM content producer or creative operations user who needs to create, review, and export trailers for shows.

### Secondary users

- Show editor reviewing canon and inferred details.
- Marketing user choosing a finished trailer.
- Creative lead approving narration and visual style.

## 5. Jobs to be done

When I have a show with only a title, cover, and synopsis, I want the system to prepare, generate, and assemble a trailer with controllable creative decisions so that I can create a usable preview without coordinating a full production team.

When the generated voice or shot is wrong, I want to change only that scene and preserve the rest of the approved work.

When I return after a failure or refresh, I want all project state and media versions to remain available.

## 6. MVP goals

1. Convert a short synopsis into a structured story, visual, and voice bible.
2. Preserve the exact synopsis wording for narration.
3. Produce emotionally directed narration that can be reviewed and regenerated.
4. Generate a duration-aware visual shot plan and video prompts.
5. Accept generated video clips from one provider or manual upload.
6. Support shot-by-shot approval and one retry version.
7. Stitch approved clips and audio into a final vertical MP4.
8. Work reliably for 6 to 7 demo projects using local persistence.
9. Support a fully cached offline demo.

## 7. MVP constraints

- Input synopsis length: 50 to 115 words recommended.
- Output aspect ratio: 9:16.
- Target output duration: determined by approved narration, typically 35 to 60 seconds.
- Number of scenes: 4 to 6.
- One narrator voice per project.
- One protagonist and up to one supporting character recommended for the hero demo.
- At most two video versions per scene.
- At most three concurrent video-generation jobs.
- Hard cut or simple fade transitions only.
- Local SQLite database.
- Local filesystem media storage.
- No authentication.

## 8. Core user journey

### Step 1: Create project

The user enters:

- Show title.
- Exact synopsis.
- Genre.
- Language.
- Optional cover image.
- Optional character/environment reference images.

The system validates synopsis length and creates a project.

### Step 2: Analyze synopsis

The system creates:

- Premise.
- Central conflict.
- Emotional promise.
- Main characters.
- Environments.
- Mood.
- Visual style.
- Voice identity.

Every derived field is labeled as one of:

- From synopsis.
- AI inferred.
- User edited.
- Approved.

### Step 3: Create narration scenes

The system splits the synopsis without changing any spoken words. It assigns each scene:

- Exact text.
- Emotion.
- Intensity from 1 to 10.
- Pace.
- Energy.
- Ending style.
- Performance direction.
- Visual purpose.

The joined scene text must reconstruct the normalized original synopsis exactly.

### Step 4: Approve emotional TTS

For each scene, the user can:

- Generate narration.
- Play narration.
- Edit performance direction.
- Regenerate narration.
- Approve narration.

Video generation remains disabled until that scene's narration is approved.

### Step 5: Generate or upload shots

After TTS approval, the system:

- Measures actual narration duration.
- Adds 1.2 seconds of visual breathing room.
- Chooses a provider-supported clip duration.
- Creates a detailed video prompt.
- Submits a generation job or accepts a manual upload.

### Step 6: Review shots

For each scene, the user can:

- Preview muted video with approved narration.
- Approve a version.
- Reject a version with a reason.
- Edit prompt and retry.
- Retry unchanged.
- Upload a replacement clip.
- Restore a previous version.

### Step 7: Stitch and export

The Stitch Trailer action is enabled only when all scenes have:

- Approved TTS.
- One approved video version.

The user selects:

- Optional background music.
- Show title.
- CTA text.
- Subtitle on/off.

The system exports an H.264 vertical MP4.

## 9. Functional requirements

### FR-01 Project creation

The application shall create and persist a project containing title, synopsis, genre, language, and optional media paths.

### FR-02 Structured production bible

The application shall derive a story bible, visual bible, and voice bible using structured AI output.

### FR-03 Groundedness labels

The application shall distinguish source facts from inferred creative details.

### FR-04 Exact narration preservation

The application shall preserve every word of the normalized synopsis across narration scenes and shall block generation if reconstruction fails.

### FR-05 Emotional direction

The application shall assign emotion, intensity, pace, energy, ending style, and performance direction to every narration scene.

### FR-06 TTS review

The application shall allow scene-level TTS generation, playback, regeneration, and approval.

### FR-07 Duration planning

The application shall measure TTS duration and calculate target visual duration as TTS duration plus 1.2 seconds.

### FR-08 Video prompt generation

The application shall create a scene-specific video prompt using approved story, character, environment, mood, and duration information.

### FR-09 Video version management

The application shall preserve every generated or uploaded video version and allow one version to be approved.

### FR-10 Failure isolation

A failed shot shall not invalidate approved TTS, other scenes, or the final project state.

### FR-11 Final assembly

The application shall normalize media and assemble approved scene videos, narration, subtitles, optional music, title card, and CTA.

### FR-12 Offline demo

The application shall load a seeded project with cached media and support the complete review and export workflow without external APIs.

## 10. Project states

- DRAFT
- ANALYZING
- BIBLE_READY
- VOICE_REVIEW
- SHOT_GENERATION
- SHOT_REVIEW
- READY_TO_RENDER
- RENDERING
- COMPLETE
- FAILED

## 11. Scene states

- DRAFT
- TTS_READY
- TTS_APPROVED
- VIDEO_READY
- VIDEO_QUEUED
- VIDEO_GENERATING
- VIDEO_REVIEW
- APPROVED
- FAILED

## 12. Minimal UI requirements

The UI shall prioritize status, media preview, and approval actions over visual decoration.

Required screens:

1. Project list and Create Project.
2. Project workspace with four steps:
   - Setup.
   - Voice.
   - Shots.
   - Export.
3. Final trailer player.

The UI shall not include complex dashboards, animated graphs, drag-and-drop timelines, role management, or multi-user collaboration.

## 13. Non-functional requirements

- Server-side API keys only.
- Local persistence survives refresh and restart.
- A completed API step is never repeated unless the user explicitly regenerates it.
- All external calls have timeout, retry, and clear error states.
- File paths are stored in SQLite; media binaries are stored on disk.
- The application can run on one developer laptop.
- The final trailer can be created without internet when cached media exists.

## 14. Success criteria for the hackathon

The MVP is successful when a judge can observe this complete flow:

1. Paste a synopsis.
2. See a grounded production bible.
3. Hear emotion-directed narration.
4. Approve narration.
5. Review generated shot versions.
6. Reject one shot and view a replacement version.
7. Approve all shots.
8. Stitch and play the final trailer.

Technical success criteria:

- No data loss on refresh.
- Exact synopsis validation passes.
- At least one real TTS request succeeds.
- At least one real or manually uploaded video is processed.
- A complete cached project renders successfully.
- Final MP4 plays on the judging laptop.

## 15. Product metrics after the hackathon

The MVP shall not claim unmeasured revenue uplift. The proposed production experiment is:

Primary metric:

- Show detail page to Episode 1 play conversion.

Secondary metrics:

- Trailer play rate.
- Trailer completion rate.
- Five-minute Episode 1 survival.
- Episode 2 start rate.
- Cost per approved trailer.
- Human review time per trailer.

## 16. Out of scope

- Story analysis across hundreds of episodes.
- Personalized trailers by user mood.
- Living characters.
- Character marketplace.
- Audience simulator.
- AI music generation.
- Lip sync.
- Automatic publishing to Pocket FM.
- A/B test infrastructure.
- Cloud-scale catalog processing.
- Billing and licensing.

## 17. Future roadmap

- Batch catalog processing.
- Multi-language trailer localization using the same approved visuals.
- Automated reference-image creation.
- Multiple aspect ratios.
- Brand templates.
- Production analytics.
- Direct show-page publishing.
- Real conversion experiment integration.
