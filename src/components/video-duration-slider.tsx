"use client";

import { supportedVideoDurations } from "@/lib/video/duration";

export function VideoDurationSlider({ value, onChange, disabled }: { value: number | null; onChange: (value: number) => void; disabled?: boolean }) {
  const selected = value ?? 6;
  return <fieldset className="video-duration-slider" disabled={disabled}>
    <legend>Video duration: <strong>{selected} seconds</strong></legend>
    <input type="range" min={4} max={8} step={2} value={selected} aria-label="Video duration" aria-valuetext={`${selected} seconds`} onChange={(event) => onChange(Number(event.target.value))} />
    <div className="video-duration-labels">{supportedVideoDurations.map((duration) => <span className={duration === selected ? "selected" : ""} key={duration}>{duration} sec</span>)}</div>
    <small>Choose the source clip duration. Final Cut will trim or extend it to match the approved narration.</small>
  </fieldset>;
}
