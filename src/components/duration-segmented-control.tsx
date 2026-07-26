"use client";

import { supportedVideoDurations } from "@/lib/video/duration";

export function DurationSegmentedControl({
  value,
  onChange,
  disabled,
  model,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
  model?: string;
}) {
  const isSeedance = !model || model.toLowerCase().includes("seedance");

  return (
    <fieldset className="duration-segmented-control" disabled={disabled}>
      <legend>Video duration</legend>
      <div role="group" aria-label="Video duration">
        <button
          type="button"
          className={value === null ? "selected" : "secondary"}
          aria-pressed={value === null}
          onClick={() => onChange(null)}
        >
          Auto
        </button>
        {supportedVideoDurations.map((duration) => {
          const isDisabledSeedanceOnly = duration === 15 && !isSeedance;
          return (
            <button
              key={duration}
              type="button"
              className={value === duration ? "selected" : "secondary"}
              aria-pressed={value === duration}
              disabled={isDisabledSeedanceOnly}
              title={isDisabledSeedanceOnly ? "15s generation is limited to Seedance models" : undefined}
              onClick={() => onChange(duration)}
            >
              {duration} sec
            </button>
          );
        })}
      </div>
      <small>Choose the source clip length. Final Cut will match it to narration.</small>
    </fieldset>
  );
}
