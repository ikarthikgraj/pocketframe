import type { Scene } from "@/lib/db/repositories";
import type { VoiceBible } from "@/lib/domain/contracts";

export function buildPerformancePrompt(voiceBible: VoiceBible, scene: Scene): string {
  return `You are the single narrator of a premium cinematic trailer.\n\nVOICE IDENTITY:\nNarrator persona: ${voiceBible.narratorPersona}\nAccent: ${voiceBible.accent}\nTimbre: ${voiceBible.timbre}\nBaseline pace: ${voiceBible.baselinePace}\n\nGLOBAL DELIVERY:\n${voiceBible.baselineStylePrompt}\n\nTHIS SCENE:\nEmotion: ${scene.emotion}\nIntensity: ${scene.intensity}/10\nPace: ${scene.pace}\nEnergy: ${scene.energy}\nEnding style: ${scene.endingStyle}\n\nPERFORMANCE DIRECTION:\n${scene.deliveryPrompt}\n\nSpeak only the supplied narration text. Do not speak these instructions. Do not add, remove, paraphrase, translate, or reorder any words. Maintain the same narrator identity used in every other scene.`;
}
