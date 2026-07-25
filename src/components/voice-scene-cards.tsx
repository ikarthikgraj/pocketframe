"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AudioVersion, Scene } from "@/lib/db/repositories";

type Props = { scenes: Scene[]; audioVersions: Record<string, AudioVersion[]> };
const seconds = (value: number | null) => value === null ? "—" : `${(value / 1000).toFixed(1)} sec`;

export function VoiceSceneCards({ scenes, audioVersions }: Props) {
  const router = useRouter(); const [working, setWorking] = useState<string>(); const [error, setError] = useState<string>();
  async function generate(scene: Scene, deliveryPrompt: string) {
    setWorking(scene.id); setError(undefined);
    const response = await fetch(`/api/scenes/${scene.id}/tts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ deliveryPrompt, quality: "preview" }) });
    const data = await response.json(); setWorking(undefined); if (!response.ok) return setError(data.error?.message ?? "Could not generate audio."); router.refresh();
  }
  async function approve(sceneId: string) {
    setWorking(sceneId); setError(undefined);
    const response = await fetch(`/api/scenes/${sceneId}/approve-tts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ approved: true }) });
    const data = await response.json(); setWorking(undefined); if (!response.ok) return setError(data.error?.message ?? "Could not approve audio."); router.refresh();
  }
  return <section className="voice-section"><div className="section-heading"><div><h2>Voice</h2><p>Generate and approve one narration performance per scene.</p></div></div>{error && <p className="error" role="alert">{error}</p>}<div className="scene-list">{scenes.map((scene) => {
    const versions = audioVersions[scene.id] ?? []; const latest = versions.at(-1); const approved = scene.status === "TTS_APPROVED";
    return <VoiceCard key={scene.id} scene={scene} latest={latest} approved={approved} working={working === scene.id} onGenerate={generate} onApprove={approve} />;
  })}</div></section>;
}

function VoiceCard({ scene, latest, approved, working, onGenerate, onApprove }: { scene: Scene; latest?: AudioVersion; approved: boolean; working: boolean; onGenerate: (scene: Scene, prompt: string) => void; onApprove: (sceneId: string) => void }) {
  const [prompt, setPrompt] = useState(scene.deliveryPrompt ?? "");
  return <article className="card voice-card"><div className="section-heading"><h3>Scene {String(scene.sceneNumber).padStart(2, "0")}</h3><strong>{approved ? "TTS APPROVED" : latest ? "READY FOR REVIEW" : "NOT STARTED"}</strong></div><p className="scene-text">{scene.exactText}</p><p><b>Emotion:</b> {scene.emotion} · <b>Intensity:</b> {scene.intensity}/10 · <b>Pace:</b> {scene.pace}</p><label>Performance direction<textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} disabled={working} /></label>{latest && <audio controls src={`/api/audio-versions/${latest.id}`}><a href={`/api/audio-versions/${latest.id}`}>Play audio</a></audio>}<div className="actions"><button onClick={() => onGenerate(scene, prompt)} disabled={working}>{working ? "Generating…" : latest ? "Regenerate" : "Generate"}</button><button onClick={() => onApprove(scene.id)} disabled={!latest || working || approved}>{approved ? "Approved" : "Approve Voice"}</button></div><p><b>Measured duration:</b> {seconds(scene.ttsDurationMs)} · <b>Target video duration:</b> {seconds(scene.targetVideoDurationMs)}</p>{versionsLabel(latest)}</article>;
}

function versionsLabel(latest?: AudioVersion) { return latest ? <small>Audio version {latest.versionNumber} · {latest.provider} / {latest.model}</small> : null; }
