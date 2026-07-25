/** Fixed source-clip durations supported by the configured video adapters. */
export const supportedVideoDurations = [4, 6, 8, 10, 12] as const;

/**
 * Converts user input and legacy values to the nearest configured duration.
 * The result is always an integer from `supportedDurations`.
 */
export function normalizeVideoDuration(input: unknown, supportedDurations: readonly number[] = supportedVideoDurations): number {
  const supported = [...new Set(supportedDurations.filter((value) => Number.isInteger(value) && value > 0))].sort((a, b) => a - b);
  if (!supported.length) throw new Error("At least one supported video duration is required.");
  const value = typeof input === "number" ? input : Number(input);
  if (!Number.isFinite(value)) return supported[0]!;
  return supported.reduce((nearest, duration) => Math.abs(duration - value) < Math.abs(nearest - value) ? duration : nearest, supported[0]!);
}

export function automaticVideoDuration(targetDurationMs: number | null, supportedDurations: readonly number[] = supportedVideoDurations) {
  return normalizeVideoDuration((targetDurationMs ?? supportedDurations[0]! * 1_000) / 1_000, supportedDurations);
}
