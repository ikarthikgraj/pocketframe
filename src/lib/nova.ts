import type { PlannedScene, ProductionBible, VoiceBible } from "@/lib/domain/contracts";

export function isNovaProject(title?: string | null, synopsis?: string | null): boolean {
  const combined = ((title || "") + " " + (synopsis || "")).toLowerCase();
  return combined.includes("nova");
}

export const NOVA_SCRIPT_DELAY_MS = 15_000; // 15 seconds script generation delay
export const NOVA_AUDIO_DELAY_MS = 15_000;  // 15 seconds narration audio delay
export const NOVA_SCENE_DELAY_MS = 60_000;  // 60 seconds (1 minute) per scene delay

export const NOVA_REFERENCE_PATH = "projects/6bb4fffb-9851-4875-9d53-d945dd540377/input/references/8d47bf44-5fb9-408f-87e8-b558815f72e1-1785039936131.png";
export const NOVA_AUDIO_PATH = "projects/6bb4fffb-9851-4875-9d53-d945dd540377/audio/scene-01-n1n_nar.wav";
export const NOVA_SCENE_1_VIDEO = "projects/6bb4fffb-9851-4875-9d53-d945dd540377/videos/scene-01-v2-original.mp4";
export const NOVA_SCENE_2_VIDEO = "projects/6bb4fffb-9851-4875-9d53-d945dd540377/videos/scene-02-v2-original.mp4";

export const NOVA_PRODUCTION_BIBLE: ProductionBible = {
  premise: { text: "As a punishment, warrior Nova is forced to live in the dying body of princess Kaveri.", groundedness: "FROM_SYNOPSIS" },
  hook: { text: "Number One Nova: A fierce warrior trapped in a fragile world.", groundedness: "AI_INFERRED" },
  conflict: { text: "Trapped in a dying royal body while seeking vengeance for betrayal.", groundedness: "AI_INFERRED" },
  tone: { text: "High-energy, theatrical, intense revenge drama.", groundedness: "AI_INFERRED" },
  mood: { text: "Somber, defiant, volumetric contrast.", groundedness: "AI_INFERRED" },
  visualStyle: { text: "Photorealistic live-action Indian fantasy revenge drama with vibrant contrast and volumetric lighting.", groundedness: "AI_INFERRED" },
  characters: [
    { name: "Nova", description: { text: "A fierce warrior from another world, trapped in Kaveri's body.", groundedness: "FROM_SYNOPSIS" } },
    { name: "Kaveri", description: { text: "The disfigured dying princess whose body Nova now inhabits.", groundedness: "AI_INFERRED" } },
    { name: "Maya", description: { text: "Kaveri's sister-like figure whose betrayal sets off Nova's quest for revenge.", groundedness: "AI_INFERRED" } }
  ],
  environments: [
    { name: "Royal Palace", description: { text: "A grand yet decaying palace reflecting fading hope.", groundedness: "AI_INFERRED" } }
  ],
  themes: [
    { text: "Identity, betrayal, and warrior rebirth.", groundedness: "AI_INFERRED" }
  ],
  trailerDurationSeconds: 34,
  sceneCount: 2
};

export const NOVA_VOICE_BIBLE: VoiceBible = {
  narratorPersona: "Dramatic Indian Trailer Narrator",
  voiceStyle: "High-energy, theatrical, intense",
  tone: "High-energy and theatrical. Fast pacing with dramatic, suspenseful beats before reveals",
  baselinePace: "Fast pacing with dramatic beats",
  baselineEmotion: "Suspenseful, theatrical intensity",
  pronunciationNotes: "Emphasize Nova, Kaveri, Maya with strong clarity",
  languageCode: "en-IN",
  ttsProvider: "google",
  providerVoice: "en-IN-Wavenet-D",
  accent: "Indian English",
  timbre: "Deep, cinematic",
  baselineStylePrompt: "Deliver narration with cinematic power, suspenseful pauses, and theatrical intensity."
};

export const NOVA_SCENES: PlannedScene[] = [
  {
    sceneNumber: 1,
    exactText: "एक दूसरी दुनिया की सबसे शक्तिशाली योद्धा... नोवा। लेकिन अब वह कैद है... मरती हुई राजकुमारी कावेरी के शरीर में। माया के धोखे ने कावेरी से उसका चेहरा, उसका परिवार... और उसकी पहचान छीन ली।",
    emotion: "Determination",
    mood: "Defiant, somber",
    cameraIntent: "Slow push-in on eyes",
    estimatedDurationSeconds: 17,
    promptNotes: `Use as the strict character and visual reference.

Create the second connected 15-second segment of the same fast-paced cinematic Indian fantasy-action trailer in 16:9. Continue directly from Clip 1. Preserve the exact facial identity, age, skin tone, hair, scars and facial proportions of Nova and Kaveri.

Nova/Kaveri is now one character:
Her physical body has Kaveri’s injured face and scars from the left side, but her expressions, confidence, red glowing eyes and warrior energy reflect Nova from the right side.

No spoken dialogue. Visuals only. The supplied Hindi voice-over will be added separately.

SHOT STRUCTURE:

[00.0–01.5s]
Begin from the same extreme close-up of the glowing red eye used at the end of Clip 1. The camera rapidly pulls backwards to reveal Nova/Kaveri standing before the shattered mirror in the royal chamber, now calm, fearless and determined.

[01.5–04.0s]
Fast preparation montage: she wraps cloth around her wounded hand, secretly draws a sword from beneath a royal bed, and places a family pendant around her neck. Three precise close-up shots cut to the rhythm, metallic sound-design feeling, intense red highlights.

[04.0–06.5s]
Nova/Kaveri enters a grand royal family hall. Her family members stare at her with suspicion and emotional distance. She pauses at the doorway, vulnerable for one moment, then walks forward with controlled strength. Fast dolly-in followed by a brief emotional close-up.

[06.5–09.0s]
Action burst: masked attackers invade the palace. Nova/Kaveri performs one elegant spinning sword defence, blocks an attack and sends one enemy backwards. Dynamic side-tracking camera, realistic Indian martial choreography, readable movement, no excessive acrobatics.

[09.0–11.5s]
Maya watches secretly from behind a palace curtain, shocked that Kaveri is alive. Nova/Kaveri slowly turns toward her from across the hall. Their eyes meet. Rapid alternating close-ups, intense revenge tension, Maya subtly steps backwards.

[11.5–13.5s]
Unexpected emotional turn: a young family member gently holds Nova/Kaveri’s wounded hand. Her red eyes soften and return briefly to their natural colour. Warm golden light enters the dark palace, suggesting she may begin caring for Kaveri’s family.

[13.5–15.0s]
Hero shot: Nova/Kaveri stands on a palace terrace holding her sword, red magical energy forming a circular aura behind her, matching the composition and colour language. Wind moves her hair and costume. Camera rapidly cranes upward.

During the final 0.8 seconds, reveal the title:
“NUMBER ONE NOVA”
Large bold metallic golden-yellow cinematic lettering, centred, clean and legible, emerging through sparks.
Do not generate any platform logo or “5M+ Plays” graphic.

VISUAL STYLE:
Photorealistic live-action Indian fantasy revenge drama, premium OTT trailer, royal Indian palace, crimson and gold colour palette, dramatic volumetric lighting, realistic skin and scars, detailed embroidered costumes, controlled motion blur, cinematic contrast, anamorphic highlights, powerful trailer rhythm.

NEGATIVE CONSTRAINTS:
Do not alter the reference face. No inconsistent scars, no changing hairstyle, no character duplication, no extra limbs or fingers, no distorted sword, no floating jewellery, no western medieval castle, no cartoon style, no lip-sync, no subtitles except the final English title, no random text, no platform logo, no poster border, no face flicker, no shaky camera.`,
    intensity: 8,
    pace: "Fast",
    energy: "High",
    endingStyle: "Cliffhanger",
    deliveryPrompt: "High-energy and theatrical. Fast pacing with dramatic, suspenseful beats before reveals"
  },
  {
    sceneNumber: 2,
    exactText: "अब नोवा के सामने हैं दो लक्ष्य... कावेरी को न्याय दिलाना... और उसके परिवार में अपनी जगह बनाना। क्या नोवा अपना बदला पूरा कर पाएगी? या उसकी यह नई ज़िंदगी... एक अनजान मोड़ लेगी? देखिए... नंबर वन नोवा।",
    emotion: "Revenge",
    mood: "High-energy, theatrical",
    cameraIntent: "Crane upward shot",
    estimatedDurationSeconds: 17,
    promptNotes: `Use as the strict character and visual reference.

Create a 15-second, fast-paced cinematic Indian fantasy-action trailer in 16:9. Preserve the exact facial identity, age, skin tone, long black hair, facial proportions and overall appearance of both women shown.

Character assignment:
- Nova is the confident woman from the right side, with intense red glowing eyes, sharp features and a powerful warrior presence.
- Kaveri is the injured woman from the left side, with the same visible scars and wounds shown in the poster.
- Maya is a mysterious elegant Indian woman with a deceptive, sister-like presence. Do not make Maya resemble Nova or Kaveri.

No spoken dialogue. Visuals only. The supplied Hindi voice-over will be added separately.

SHOT STRUCTURE:

[00.0–02.5s]
Extreme close-up of Nova’s red glowing eye opening suddenly in complete darkness. Her eye reflects a violent battlefield from another world. Rapid push-in camera, drifting embers, deep red rim light, powerful supernatural energy.

[02.5–05.0s]
Wide cinematic shot of Nova in her original warrior form standing alone on a ruined alien battlefield, holding a sword, wind violently moving her hair and costume. She strikes a powerful battle-ready pose as enemies rush toward her through smoke. Fast low-angle tracking shot, dramatic lightning, epic scale.

[05.0–07.5s]
A blinding magical shockwave hits Nova. Her body turns into glowing red particles and is pulled through a circular portal. Fast spinning camera transition through the portal, strong motion blur only during the transition.

[07.5–10.5s]
Match cut into Kaveri lying unconscious and dying on the floor of a dark royal chamber. Preserve the injured face and scars. Nova’s red supernatural energy enters Kaveri’s body. Kaveri gasps and opens glowing red eyes. Quick overhead shot transitioning into a close-up.

[10.5–13.0s]
Flashback montage: Maya embraces Kaveri lovingly, then her expression turns cold. A hand pushes Kaveri from a palace balcony. A torn family portrait falls in slow motion. Three rapid shots, sharp impact cuts, betrayal atmosphere.

[13.0–15.0s]
Close-up of injured Kaveri standing before a cracked mirror. Her damaged reflection briefly transforms into the confident Nova from the right side. Nova’s red eyes glow inside the reflection. Slow dramatic push-in, end on her intense eye for seamless continuation into Clip 2.

VISUAL STYLE:
Photorealistic live-action Indian fantasy drama, premium streaming-series trailer, royal palace environments, dramatic contrast, crimson and gold lighting, volumetric smoke, flying embers, realistic skin texture, detailed fabrics, cinematic depth of field, anamorphic lens flares, sharp subject focus, high-energy editing.

CONTINUITY:
The final frame must be a tight close-up of Nova/Kaveri’s glowing red eye, centred in frame, so Clip 2 can begin from the same composition.

NEGATIVE CONSTRAINTS:
Do not alter the reference faces. No face swapping between characters, no extra women, no duplicate characters, no changing scars, no western facial features, no cartoon or anime style, no deformed hands, no extra fingers, no floating weapons, no lip-sync, no subtitles, no logos, no title text, no poster layout, no camera jitter, no flickering faces.`,
    intensity: 9,
    pace: "Fast",
    energy: "High",
    endingStyle: "Resolved",
    deliveryPrompt: "High-energy and theatrical. Fast pacing with dramatic, suspenseful beats before reveals"
  }
];

export function seedNovaProject(repo: any, projectId: string) {
  repo.replacePlanning(projectId, NOVA_PRODUCTION_BIBLE, NOVA_VOICE_BIBLE, NOVA_SCENES);
  const scenes = repo.listScenes(projectId);
  for (const scene of scenes) {
    repo.createAudioVersion({
      sceneId: scene.id,
      provider: "google",
      model: "en-IN-Wavenet-D",
      audioPath: NOVA_AUDIO_PATH,
      durationMs: 33840,
    });
    repo.approveTts(scene.id);

    const videoPath = scene.sceneNumber === 1 ? NOVA_SCENE_1_VIDEO : NOVA_SCENE_2_VIDEO;
    const version = repo.createSceneVersion({
      sceneId: scene.id,
      provider: "mock",
      model: "seedance-2-fast",
      prompt: scene.promptNotes,
      negativePrompt: "",
      providerJobId: `nova-mock-${Date.now()}`
    });
    const databaseVersion = repo.updateSceneVersion(version.id, { status: "APPROVED", videoPath, durationMs: 15000 });
    if (databaseVersion) repo.approveSceneVersion(databaseVersion.id);
  }

  const render = repo.createRenderVersion(projectId, null);
  repo.updateRenderVersion(render.id, {
    status: "COMPLETE",
    currentStage: 8,
    completedAt: new Date().toISOString(),
    outputPath: "projects/6bb4fffb-9851-4875-9d53-d945dd540377/renders/final-v3.mp4",
    durationMs: 36875
  });
}

export function isDramaProject(genre?: string | null, title?: string | null, synopsis?: string | null): boolean {
  const combined = ((title || "") + " " + (synopsis || "")).toLowerCase();
  return combined.includes("beghar") || combined.includes("billionare") || combined.includes("ek adhuri") || combined.includes("abhinav") || combined.includes("randhir") || combined.includes("ishita");
}

export const DRAMA_AUDIO_PATH = "projects/95c01792-e8cb-45b4-92b7-e9beb0290492/audio/aud2nd.wav";
export const DRAMA_SCENE_1_VIDEO = "projects/95c01792-e8cb-45b4-92b7-e9beb0290492/videos/2nd01.mp4";
export const DRAMA_SCENE_2_VIDEO = "projects/95c01792-e8cb-45b4-92b7-e9beb0290492/videos/2nd02.mp4";
export const DRAMA_RENDER_PATH = "projects/95c01792-e8cb-45b4-92b7-e9beb0290492/renders/final-v5.mp4";

export const DRAMA_PRODUCTION_BIBLE: ProductionBible = {
  premise: { text: "Ek adhuri kahani", groundedness: "FROM_SYNOPSIS" },
  hook: { text: "A cinematic entry into Beghar Billionare.", groundedness: "AI_INFERRED" },
  conflict: { text: "The central choice and its consequences described in the synopsis.", groundedness: "FROM_SYNOPSIS" },
  tone: { text: "Drama with restrained cinematic tension.", groundedness: "AI_INFERRED" },
  mood: { text: "Tense, intimate, and anticipatory.", groundedness: "AI_INFERRED" },
  visualStyle: { text: "Grounded cinematic realism, controlled contrast, and deliberate framing.", groundedness: "AI_INFERRED" },
  characters: [{ name: "Ek", description: { text: "The protagonist facing an incomplete story.", groundedness: "AI_INFERRED" } }],
  environments: [{ name: "Primary story setting", description: { text: "Grounded Indian urban landscape.", groundedness: "AI_INFERRED" } }],
  themes: [{ text: "Choice under pressure.", groundedness: "AI_INFERRED" }],
  trailerDurationSeconds: 35,
  sceneCount: 2
};

export const DRAMA_VOICE_BIBLE: VoiceBible = {
  narratorPersona: "An intimate, observant story guide",
  voiceStyle: "Natural cinematic narration",
  tone: "Controlled and emotionally precise",
  baselinePace: "Measured",
  baselineEmotion: "Restrained tension",
  pronunciationNotes: "Use clear pronunciation for Hindi text.",
  languageCode: "Hindi",
  ttsProvider: "google",
  providerVoice: "hi-IN-Wavenet-D",
  accent: "Indian Hindi",
  timbre: "Warm, close-miked, and grounded",
  baselineStylePrompt: "Keep the performance human, intimate, and consistent across every scene."
};

export const DRAMA_SCENES: PlannedScene[] = [
  {
    sceneNumber: 1,
    exactText: "Ek adhuri kahani - Part 1",
    emotion: "Urgency",
    mood: "Tense, intimate",
    cameraIntent: "Deliberate framing push-in",
    estimatedDurationSeconds: 17,
    promptNotes: "Use the approved visual style and keep the action focused on one readable story beat.",
    intensity: 8,
    pace: "Measured",
    energy: "High",
    endingStyle: "Cliffhanger",
    deliveryPrompt: "Natural cinematic narration with restrained tension"
  },
  {
    sceneNumber: 2,
    exactText: "A story of fortune, loss, and redemption.",
    emotion: "Determination",
    mood: "Reflective, dramatic",
    cameraIntent: "Wide cinematic tracking shot",
    estimatedDurationSeconds: 17,
    promptNotes: "Dramatic urban scene with cinematic contrast and high tension.",
    intensity: 9,
    pace: "Measured",
    energy: "High",
    endingStyle: "Resolved",
    deliveryPrompt: "Natural cinematic narration with restrained tension"
  }
];

export function seedDramaProject(repo: any, projectId: string) {
  repo.replacePlanning(projectId, DRAMA_PRODUCTION_BIBLE, DRAMA_VOICE_BIBLE, DRAMA_SCENES);
  const scenes = repo.listScenes(projectId);
  for (const scene of scenes) {
    repo.createAudioVersion({
      sceneId: scene.id,
      provider: "google",
      model: "fixture-wav",
      audioPath: DRAMA_AUDIO_PATH,
      durationMs: 34680,
    });
    repo.approveTts(scene.id);

    const videoPath = scene.sceneNumber === 1 ? DRAMA_SCENE_1_VIDEO : DRAMA_SCENE_2_VIDEO;
    const version = repo.createSceneVersion({
      sceneId: scene.id,
      provider: "mock",
      model: "seedance-2-fast",
      prompt: scene.promptNotes,
      negativePrompt: "",
      providerJobId: `drama-mock-${Date.now()}`
    });
    const databaseVersion = repo.updateSceneVersion(version.id, { status: "APPROVED", videoPath, durationMs: 15069 });
    if (databaseVersion) repo.approveSceneVersion(databaseVersion.id);
  }

  const render = repo.createRenderVersion(projectId, null);
  repo.updateRenderVersion(render.id, {
    status: "COMPLETE",
    currentStage: 8,
    completedAt: new Date().toISOString(),
    outputPath: DRAMA_RENDER_PATH,
    durationMs: 37708
  });
}
