import { plannedSceneSchema, productionBibleSchema, voiceBibleSchema, type PlannedScene, type ProductionBible, type VoiceBible } from "@/lib/domain/contracts";
import type { Project } from "@/lib/db/repositories";
import { validateSynopsisReconstruction } from "@/lib/synopsis/validate";

export type PlanningResult = { productionBible: ProductionBible; voiceBible: VoiceBible; scenes: PlannedScene[] };
export interface StoryPlanner {
  plan(project: Project, exactSegments: string[]): Promise<PlanningResult>;
}

export class MockStoryPlanner implements StoryPlanner {
  async plan(project: Project, exactSegments: string[]): Promise<PlanningResult> {
    validateSynopsisReconstruction(project.synopsis, exactSegments);
    const protagonist = project.synopsis.match(/\b[A-Z][a-z]+\b/)?.[0] ?? "The protagonist";
    const bible = productionBibleSchema.parse({
      premise: { text: project.synopsis, groundedness: "FROM_SYNOPSIS" },
      hook: { text: `A cinematic entry into ${project.title}.`, groundedness: "AI_INFERRED" },
      conflict: { text: "The central choice and its consequences described in the synopsis.", groundedness: "FROM_SYNOPSIS" },
      tone: { text: `${project.genre} with restrained cinematic tension.`, groundedness: "AI_INFERRED" },
      mood: { text: "Tense, intimate, and anticipatory.", groundedness: "AI_INFERRED" },
      visualStyle: { text: "Grounded cinematic realism, controlled contrast, and deliberate framing.", groundedness: "AI_INFERRED" },
      characters: [{ name: protagonist, description: { text: "Primary figure referenced in the official synopsis.", groundedness: "FROM_SYNOPSIS" } }],
      environments: [{ name: "Primary story setting", description: { text: "A setting inferred only from the official synopsis.", groundedness: "AI_INFERRED" } }],
      themes: [{ text: "Choice under pressure.", groundedness: "AI_INFERRED" }],
      trailerDurationSeconds: Math.min(40, Math.max(30, exactSegments.length * 8)),
      sceneCount: exactSegments.length,
    });
    const voiceBible = voiceBibleSchema.parse({
      narratorPersona: "An intimate, observant story guide",
      voiceStyle: "Natural cinematic narration",
      tone: "Controlled and emotionally precise",
      baselinePace: "Measured",
      baselineEmotion: "Restrained tension",
      pronunciationNotes: "Use clear pronunciation for names and place names from the supplied narration.",
      languageCode: project.languageCode,
      ttsProvider: process.env.POCKETFRAME_TTS_PROVIDER === "gemini" ? "gemini" : "mock",
      providerVoice: process.env.POCKETFRAME_TTS_PROVIDER === "gemini" ? (process.env.GEMINI_TTS_VOICE ?? "configured Gemini voice") : "default-narrator",
      accent: "Neutral to the selected language",
      timbre: "Warm, close-miked, and grounded",
      baselineStylePrompt: "Keep the performance human, intimate, and consistent across every scene.",
    });
    const scenes = exactSegments.map((exactText, index) => plannedSceneSchema.parse({
      sceneNumber: index + 1,
      exactText,
      emotion: index === exactSegments.length - 1 ? "Urgency" : "Controlled tension",
      mood: "Suspenseful",
      cameraIntent: index === 0 ? "Slow establishing push-in" : "Measured forward movement toward the choice",
      estimatedDurationSeconds: Math.max(4, Math.ceil(exactText.trim().split(/\s+/).length / 2.5)),
      promptNotes: "Use the approved visual style and keep the action focused on one readable story beat.",
      intensity: index === exactSegments.length - 1 ? 8 : 6,
      pace: index === exactSegments.length - 1 ? "Measured, tightening" : "Measured",
      energy: index === exactSegments.length - 1 ? "Rising" : "Controlled",
      endingStyle: index === exactSegments.length - 1 ? "Leave a quiet unresolved beat" : "Hold the final word briefly",
      deliveryPrompt: index === exactSegments.length - 1 ? "Let urgency rise without rushing; leave the final image hanging." : "Deliver with restrained tension and a clear, intimate sense of discovery.",
    }));
    return { productionBible: bible, voiceBible, scenes };
  }
}

export const storyPlanner: StoryPlanner = new MockStoryPlanner();
