export const VIDEO_MODELS = [
  { id: "seedance-2-fast", label: "Seedance 2.0 Fast" },
  { id: "kling-v3-pro", label: "Kling V3 Pro" },
  { id: "veo-3-1", label: "Veo 3.1" },
] as const;

export type VideoModelId = (typeof VIDEO_MODELS)[number]["id"];

/** Keeps legacy records readable without mutating their provider job history. */
export function normalizeVideoModel(value: string | null | undefined): VideoModelId {
  const candidate = value?.toLowerCase() ?? "";
  if (candidate.includes("kling")) return "kling-v3-pro";
  if (candidate.includes("veo")) return "veo-3-1";
  return "seedance-2-fast";
}

export function videoModelLabel(value: string | null | undefined) {
  const id = normalizeVideoModel(value);
  return VIDEO_MODELS.find((model) => model.id === id)!.label;
}
