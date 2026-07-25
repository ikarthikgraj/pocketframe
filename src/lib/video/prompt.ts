const forbiddenAudioTerms = [
  "narration", "narrator", "voice-over", "voiceover", "dialogue", "says", "speaking",
  "soundtrack", "music", "sound effect", "audio", "we hear", "lip-sync", "lipsync",
];

export const silentVideoNegativePrompt = "No subtitles, captions, logos, watermarks, on-screen text, lip sync, dialogue, narration, voice-over, music, sound effects, audio, face morphing, identity drift, costume changes, duplicate people, extra limbs, malformed hands, flicker, frame warping, abrupt camera jumps, excessive motion blur, plastic skin, game-engine look, graphic violence, or unsafe content.";

/** Visual generation is deliberately silent. Exact narration stays in the source field only. */
export function assertSilentVisualPrompt(prompt: string) {
  const normalized = prompt.toLowerCase();
  const found = forbiddenAudioTerms.find((term) => normalized.includes(term));
  if (found) throw new Error(`Visual prompts must contain visuals only. Remove the audio-related term “${found}”.`);
  return prompt.trim();
}

export function defaultSilentVisualPrompt(promptNotes?: string | null) {
  return assertSilentVisualPrompt(promptNotes?.trim() || "Cinematic vertical shot with one readable action, deliberate camera movement, and consistent character and environment references.");
}
