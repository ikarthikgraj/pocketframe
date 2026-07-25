"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AudioVersion, Scene } from "@/lib/db/repositories";
import type { VoiceBible } from "@/lib/domain/contracts";

type Props = { scenes: Scene[]; audioVersions: Record<string, AudioVersion[]>; voiceBible: VoiceBible | null };
const seconds = (value: number | null) => value === null ? "—" : `${(value / 1000).toFixed(1)} sec`;

export function VoiceSceneCards({ scenes, audioVersions, voiceBible }: Props) {
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
  return <section id="voice" className="voice-section"><div className="section-heading"><div><p className="eyebrow">Narration review</p><h2>Voice</h2><p>Generate and approve one narration performance per scene.</p></div></div>{voiceBible && <article className="voice-bible"><div><p className="eyebrow">Voice bible</p><h3>{voiceBible.narratorPersona}</h3><p>{voiceBible.voiceStyle}</p></div><dl><div><dt>Tone</dt><dd>{voiceBible.tone}</dd></div><div><dt>Pace</dt><dd>{voiceBible.baselinePace}</dd></div><div><dt>Baseline emotion</dt><dd>{voiceBible.baselineEmotion}</dd></div><div><dt>Language</dt><dd>{voiceBible.languageCode}</dd></div><div><dt>Provider</dt><dd>{voiceBible.ttsProvider}</dd></div></dl></article>}{error && <p className="error" role="alert">{error}</p>}<div className="scene-list">{scenes.map((scene) => {
    const versions = audioVersions[scene.id] ?? []; const latest = versions.at(-1); const approved = scene.status === "TTS_APPROVED";
    return <VoiceCard key={scene.id} scene={scene} latest={latest} approved={approved} working={working === scene.id} onGenerate={generate} onApprove={approve} />;
  })}</div></section>;
}

function VoiceCard({ scene, latest, approved, working, onGenerate, onApprove }: { scene: Scene; latest?: AudioVersion; approved: boolean; working: boolean; onGenerate: (scene: Scene, prompt: string) => void; onApprove: (sceneId: string) => void }) {
  const [prompt, setPrompt] = useState(scene.deliveryPrompt ?? "");
  return <article className={`card voice-card ${approved ? "is-approved" : ""}`}><div className="section-heading"><h3>Scene {String(scene.sceneNumber).padStart(2, "0")}</h3><span className={`status-badge ${approved ? "status-approved" : latest ? "status-generated" : "status-pending"}`}>{approved ? "Approved" : latest ? "Generated" : "Pending"}</span></div><p className="scene-text">{scene.exactText}</p><div className="detail-row"><span><b>Emotion</b>{scene.emotion}</span><span><b>Intensity</b>{scene.intensity}/10</span><span><b>Pace</b>{scene.pace}</span></div><label>Delivery prompt<textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} disabled={working} /></label>{latest && <audio controls src={`/api/audio-versions/${latest.id}`}><a href={`/api/audio-versions/${latest.id}`}>Play audio</a></audio>}<div className="actions"><button onClick={() => onGenerate(scene, prompt)} disabled={working}>{working ? "Generating…" : latest ? "Regenerate" : "Generate"}</button><button className="secondary" onClick={() => onApprove(scene.id)} disabled={!latest || working || approved}>{approved ? "Approved" : "Approve Voice"}</button></div><p className="duration-line"><b>Measured duration:</b> {seconds(scene.ttsDurationMs)} <span /> <b>Target video:</b> {seconds(scene.targetVideoDurationMs)}</p>{versionsLabel(latest)}</article>;
}

function versionsLabel(latest?: AudioVersion) { return latest ? <small>Audio version {latest.versionNumber} · {latest.provider} / {latest.model}</small> : null; }
