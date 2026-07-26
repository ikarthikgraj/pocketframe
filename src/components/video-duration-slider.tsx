"use client";

import { supportedVideoDurations } from "@/lib/video/duration";

export function VideoDurationSlider({ value, onChange, disabled }: { value: number | null; onChange: (value: number) => void; disabled?: boolean }) {
  const selected = value ?? 6;
  return (
    <div className="video-duration-compact">
      <span className="compact-label">Duration</span>
      <div className="duration-pill-group">
        {supportedVideoDurations.map((duration) => (
          <button
            type="button"
            key={duration}
            className={`duration-pill-btn ${duration === selected ? "is-selected" : ""}`}
            disabled={disabled}
            onClick={() => onChange(duration)}
          >
            {duration}s
          </button>
        ))}
      </div>
    </div>
  );
}
