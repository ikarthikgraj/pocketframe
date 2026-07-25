export function normalizeSynopsis(synopsis: string): string {
  return synopsis.replace(/\s+/g, " ").trim();
}

function unitsFor(text: string, count: number): string[] {
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s+|$)|[^.!?]+$/g) ?? [text];
  if (sentences.length >= count) return sentences;
  return text.match(/\S+\s*|\s+/g) ?? [text];
}

export function segmentSynopsis(synopsis: string, maxScenes = 4): string[] {
  const source = normalizeSynopsis(synopsis);
  if (!source) throw new Error("A synopsis is required for segmentation.");
  const words = source.split(" ").length;
  const desired = Math.min(maxScenes, Math.max(1, Math.ceil(words / 25)));
  const units = unitsFor(source, desired);
  const sceneCount = Math.min(desired, units.length);
  const targetLength = source.length / sceneCount;
  const scenes: string[] = [];
  let current = "";

  for (let index = 0; index < units.length; index += 1) {
    const unitsRemaining = units.length - index;
    const scenesRemaining = sceneCount - scenes.length;
    if (current && (current.length >= targetLength || unitsRemaining === scenesRemaining)) {
      scenes.push(current);
      current = "";
    }
    current += units[index];
  }
  if (current) scenes.push(current);

  // Guard: merge any overflow segments into the last one so we never exceed maxScenes.
  while (scenes.length > maxScenes) {
    const overflow = scenes.pop()!;
    scenes[scenes.length - 1] += overflow;
  }

  return scenes;
}
