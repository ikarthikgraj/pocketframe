const forbiddenAudioTerms = [
  "narration", "narrator", "voice-over", "voiceover", "dialogue", "says", "speaking",
  "soundtrack", "music", "sound effect", "audio", "we hear", "lip-sync", "lipsync",
];

export const silentVideoNegativePrompt = "No subtitles, captions, logos, watermarks, on-screen text, lip sync, dialogue, narration, voice-over, music, sound effects, audio, face morphing, identity drift, costume changes, duplicate people, extra limbs, malformed hands, flicker, frame warping, abrupt camera jumps, excessive motion blur, plastic skin, game-engine look, graphic violence, or unsafe content.";

/** Visual generation prompt bypass: returns clean trimmed prompt without throwing errors for any terms. */
export function assertSilentVisualPrompt(prompt: string) {
  return prompt.trim();
}

export function defaultSilentVisualPrompt(promptNotes?: string | null) {
  return assertSilentVisualPrompt(promptNotes?.trim() || "Cinematic vertical shot with one readable action, deliberate camera movement, and consistent character and environment references.");
}

export type SelectedVisualReference = { id: string; name: string; type: "Character" | "Environment" | "Prop" | "Style"; path: string; description: string | null };

const referenceInstructions: Record<SelectedVisualReference["type"], string> = {
  Character: "Use the selected character reference for facial identity, costume, body, and wardrobe continuity.",
  Environment: "Use the selected environment reference for architecture, geography, lighting layout, and set continuity.",
  Prop: "Use the selected prop reference for exact appearance, scale, material, and color continuity.",
  Style: "Use the selected style reference for composition, visual treatment, and cinematography.",
};

export function stripReferenceContinuityInstructions(prompt: string) {
  return prompt.split("\n\n").filter((block) => !Object.values(referenceInstructions).includes(block.trim())).join("\n\n").trim();
}

/** Adds continuity directions only for references explicitly selected for this scene. */
export function composeVisualPromptWithReferences(prompt: string, selectedReferences: SelectedVisualReference[]) {
  const instructions = [...new Set(selectedReferences.map((reference) => referenceInstructions[reference.type]))];
  return assertSilentVisualPrompt([stripReferenceContinuityInstructions(prompt), ...instructions].filter(Boolean).join("\n\n"));
}
