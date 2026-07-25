"use client";

import { normalizeVideoDuration, supportedVideoDurations } from "@/lib/video/duration";
import type { CSSProperties } from "react";

export function ShotDurationSlider({ value, onChange, disabled, label = "Shot duration" }: { value: number | null | undefined; onChange: (value: number) => void; disabled?: boolean; label?: string }) {
  const selected = normalizeVideoDuration(value ?? 8, supportedVideoDurations);
  return <fieldset className="video-duration-slider" disabled={disabled}>
    <legend>{label}: <strong>{selected} seconds</strong></legend>
    <input type="range" min={4} max={12} step={2} value={selected} style={{ "--slider-progress": `${((selected - 4) / 8) * 100}%` } as CSSProperties} aria-label={label} aria-valuetext={`${selected} seconds`} onChange={(event) => onChange(Number(event.target.value))} />
    <div className="video-duration-labels">{supportedVideoDurations.map((duration) => <span className={duration === selected ? "selected" : ""} key={duration}>{duration}s</span>)}</div>
    <small>Choose how long the generated shot should be. Final Cut will match the approved shot to the approved narration.</small>
  </fieldset>;
}
