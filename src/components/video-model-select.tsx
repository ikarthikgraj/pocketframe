import { VIDEO_MODELS, type VideoModelId } from "@/lib/video/models";

export function VideoModelSelect({ value, onChange, disabled }: { value: VideoModelId; onChange: (value: VideoModelId) => void; disabled?: boolean }) {
  return <label className="video-model-select">Video model<select value={value} onChange={(event) => onChange(event.target.value as VideoModelId)} disabled={disabled}>{VIDEO_MODELS.map((model) => <option value={model.id} key={model.id}>{model.label}</option>)}</select></label>;
}
