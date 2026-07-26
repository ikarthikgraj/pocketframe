"use client";

import { supportedVideoDurations } from "@/lib/video/duration";

export function VideoDurationSlider({
  value,
  onChange,
  disabled,
  model,
}: {
  value: number | null;
  onChange: (value: number) => void;
  disabled?: boolean;
  model?: string;
}) {
  const selected = value ?? 6;
  const isSeedance = !model || model.toLowerCase().includes("seedance");

  return (
    <div className="video-duration-compact">
      <span className="compact-label">Duration</span>
      <div className="duration-pill-group">
        {supportedVideoDurations.map((duration) => {
          const isDisabledSeedanceOnly = duration === 15 && !isSeedance;
          return (
            <button
              type="button"
              key={duration}
              className={`duration-pill-btn ${duration === selected ? "is-selected" : ""}`}
              disabled={disabled || isDisabledSeedanceOnly}
              title={isDisabledSeedanceOnly ? "15s generation is limited to Seedance models" : undefined}
              onClick={() => onChange(duration)}
            >
              {duration}s
            </button>
          );
        })}
      </div>
    </div>
  );
}
