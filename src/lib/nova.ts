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
    promptNotes: "Cinematic vertical shot of Nova awakening in Kaveri's body, slow push-in, rich dramatic lighting.",
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
    promptNotes: "Nova/Kaveri standing on palace terrace with crimson aura and metallic sword.",
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
