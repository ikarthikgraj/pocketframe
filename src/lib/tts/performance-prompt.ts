import type { Scene } from "@/lib/db/repositories";
import type { VoiceBible } from "@/lib/domain/contracts";

export function buildPerformancePrompt(voiceBible: VoiceBible, scene: Scene): string {
  return `You are the single narrator of a premium cinematic trailer.

TONE & STYLE DIRECTIVE:
High-energy and theatrical. Fast pacing with dramatic, suspenseful beats before reveals.

VOICE IDENTITY:
Narrator persona: ${voiceBible.narratorPersona}
Accent: ${voiceBible.accent}
Timbre: ${voiceBible.timbre}
Baseline pace: ${voiceBible.baselinePace}

GLOBAL DELIVERY:
${voiceBible.baselineStylePrompt}

THIS SCENE:
Emotion: ${scene.emotion}
Intensity: ${scene.intensity}/10
Pace: ${scene.pace}
Energy: ${scene.energy}
Ending style: ${scene.endingStyle}

PERFORMANCE DIRECTION:
${scene.deliveryPrompt}

Speak only the supplied narration text. Do not speak these instructions. Do not add, remove, paraphrase, translate, or reorder any words. Maintain the same narrator identity used in every other scene.`;
}
