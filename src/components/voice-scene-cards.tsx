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
  return <section id="voice" className="voice-section"><div className="section-heading"><div><p className="eyebrow">Narration review</p><h2>Voice Bible</h2><p>Exact synopsis narration, directed scene by scene.</p></div></div>{voiceBible && <article className="voice-bible"><div><strong>{voiceBible.narratorPersona}</strong><span>{voiceBible.voiceStyle}</span></div><dl><div><dt>Tone</dt><dd>{voiceBible.tone}</dd></div><div><dt>Pace</dt><dd>{voiceBible.baselinePace}</dd></div><div><dt>Language</dt><dd>{voiceBible.languageCode}</dd></div><div><dt>Provider</dt><dd>{voiceBible.ttsProvider}</dd></div></dl></article>}{error && <p className="error" role="alert">{error}</p>}<div className="voice-table">{scenes.map((scene) => {
    const versions = audioVersions[scene.id] ?? []; const latest = versions.at(-1); const approved = scene.status === "TTS_APPROVED";
    return <VoiceCard key={scene.id} scene={scene} latest={latest} approved={approved} working={working === scene.id} onGenerate={generate} onApprove={approve} />;
  })}</div></section>;
}

function VoiceCard({ scene, latest, approved, working, onGenerate, onApprove }: { scene: Scene; latest?: AudioVersion; approved: boolean; working: boolean; onGenerate: (scene: Scene, prompt: string) => void; onApprove: (sceneId: string) => void }) {
  const [prompt, setPrompt] = useState(scene.deliveryPrompt ?? "");
  return <article className={`voice-row ${approved ? "is-approved" : ""}`}><div className="voice-row-summary"><strong>Scene {String(scene.sceneNumber).padStart(2, "0")}</strong><p>{scene.exactText}</p><span>{scene.emotion}</span><span>{scene.pace}</span><span>{seconds(scene.ttsDurationMs)}</span><span className={`status-badge ${approved ? "status-approved" : latest ? "status-generated" : "status-pending"}`}>{approved ? "Approved" : latest ? "Generated" : "Pending"}</span></div><div className="actions voice-actions"><button onClick={() => onGenerate(scene, prompt)} disabled={working}>{working ? "Generating narration…" : latest ? "Regenerate" : "Generate Narration"}</button>{latest && <><a className="button secondary" href={`/api/audio-versions/${latest.id}`}>Play</a><button className="secondary" onClick={() => onApprove(scene.id)} disabled={working || approved}>{approved ? "Approved" : "Approve"}</button></>}</div><details><summary>Delivery direction and provider metadata</summary><label>Delivery direction<textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} disabled={working} /></label><p className="duration-line"><b>Target visual duration:</b> {seconds(scene.targetVideoDurationMs)}</p>{versionsLabel(latest)}</details></article>;
}

function versionsLabel(latest?: AudioVersion) { return latest ? <small>Audio version {latest.versionNumber} · {latest.provider} / {latest.model}</small> : null; }
