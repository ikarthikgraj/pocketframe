export type AspectRatio = "9:16" | "16:9" | "1:1";

export function AspectRatioSelect({
  value,
  onChange,
  disabled,
}: {
  value: AspectRatio;
  onChange: (value: AspectRatio) => void;
  disabled?: boolean;
}) {
  return (
    <div className="video-model-compact">
      <span className="compact-label">Aspect Ratio</span>
      <select value={value} onChange={(event) => onChange(event.target.value as AspectRatio)} disabled={disabled}>
        <option value="9:16">9:16 (Vertical)</option>
        <option value="16:9">16:9 (Landscape)</option>
        <option value="1:1">1:1 (Square)</option>
      </select>
    </div>
  );
}
