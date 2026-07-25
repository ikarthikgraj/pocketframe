"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AudioVersion, Scene } from "@/lib/db/repositories";
import type { VoiceBible } from "@/lib/domain/contracts";
import { BeginnerHint } from "@/components/production-experience";

type Props = {
  projectId: string;
  scenes: Scene[];
  audioVersions: Record<string, AudioVersion[]>;
  voiceBible: VoiceBible | null;
};

export function VoiceSceneCards({ projectId, scenes, audioVersions, voiceBible }: Props) {
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string>();

  const fullNarrationText = scenes.map((scene) => scene.exactText).join(" ");
  const allAudioVersions = Object.values(audioVersions).flat();
  const latestAudio = allAudioVersions.at(-1);
  const isApproved = scenes.length > 0 && scenes.every((scene) => audioVersions[scene.id]?.some((v) => v.status === "APPROVED"));

  async function generateFullVoice() {
    setWorking(true);
    setError(undefined);
    const response = await fetch(`/api/projects/${projectId}/tts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quality: "preview" }),
    });
    const data = await response.json();
    setWorking(false);
    if (!response.ok) return setError(data.error?.message ?? "Could not generate voice narration.");
    router.refresh();
  }

  return (
    <section id="voice" className="voice-section">
      <BeginnerHint>Review the full story narration text below and generate single-file audio narration.</BeginnerHint>

      {error && <p className="error" role="alert" style={{ marginBottom: 16 }}>{error}</p>}

      {/* Voice Direction & Voice Bible */}
      {voiceBible && (
        <section className="voice-direction">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Voice Bible</p>
              <h2>Narrator Direction</h2>
            </div>
            <span className={`status-badge ${isApproved ? "status-approved" : latestAudio ? "status-generated" : "status-pending"}`}>
              {isApproved ? "Approved" : latestAudio ? "Narration Generated" : "Ready to Generate"}
            </span>
          </div>

          <article className="voice-bible">
            <div>
              <strong>{voiceBible.narratorPersona}</strong>
              <span>{voiceBible.voiceStyle}</span>
            </div>
            <dl>
              <div><dt>Tone</dt><dd>{voiceBible.tone}</dd></div>
              <div><dt>Pace</dt><dd>{voiceBible.baselinePace}</dd></div>
              <div><dt>Language</dt><dd>{voiceBible.languageCode}</dd></div>
              <div><dt>Provider</dt><dd>{voiceBible.ttsProvider}</dd></div>
            </dl>
          </article>
        </section>
      )}

      {/* Single Voice Generation Panel */}
      <section className="narration-review">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Narration Text Review</p>
            <h2>Full Trailer Narration Script</h2>
            <p>Review the exact synopsis text before generating voice narration.</p>
          </div>
        </div>

        <div className="voice-review-card">
          <label style={{ fontWeight: 700, display: "block", marginBottom: 8 }}>
            Script ({scenes.length} scene beats)
          </label>
          <textarea
            value={fullNarrationText}
            readOnly
            rows={5}
            style={{ width: "100%", background: "#f9fafb", cursor: "default" }}
          />

          <div className="actions" style={{ marginTop: 16 }}>
            <button onClick={generateFullVoice} disabled={working}>
              {working ? "Generating Narration MP3…" : latestAudio ? "Regenerate Narration MP3" : "Generate Narration MP3"}
            </button>
          </div>

          {latestAudio && (
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
              <p className="eyebrow">Audio Preview</p>
              <audio controls src={`/api/audio-versions/${latestAudio.id}`} style={{ width: "100%", marginTop: 8 }} />
              <p className="duration-line" style={{ marginTop: 8 }}>
                <b>Duration:</b> {(latestAudio.durationMs / 1000).toFixed(1)}s · <b>Status:</b>{" "}
                <span className={`status-badge ${isApproved ? "status-approved" : "status-generated"}`}>
                  {isApproved ? "Approved" : "Ready for review"}
                </span>
              </p>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}
