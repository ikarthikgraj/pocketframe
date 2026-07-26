"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type { AudioVersion, Scene } from "@/lib/db/repositories";
import type { VoiceBible } from "@/lib/domain/contracts";

type Props = { projectId: string; scenes: Scene[]; audioVersions: Record<string, AudioVersion[]>; voiceBible: VoiceBible | null };
const stamp = (value: string) => new Intl.DateTimeFormat("en", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));

export function NarrationScriptEditor({
  scene,
  onSaved,
  isEditing,
  onEditToggle,
}: {
  scene: Scene;
  onSaved: () => void;
  isEditing?: boolean;
  onEditToggle?: (editing: boolean) => void;
}) {
  const [internalEditing, setInternalEditing] = useState(false);
  const editing = isEditing ?? internalEditing;
  const setEditing = (val: boolean) => {
    setInternalEditing(val);
    onEditToggle?.(val);
  };
  const [value, setValue] = useState(scene.currentNarrationText);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string>();
  const edited = scene.currentNarrationText !== scene.originalNarrationText;

  async function save(next = value) {
    setWorking(true);
    setError(undefined);
    const response = await fetch(`/api/scenes/${scene.id}/narration`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ narration: next }),
    });
    const data = await response.json().catch(() => ({}));
    setWorking(false);
    if (!response.ok) return setError(data.error?.message ?? "Could not save narration.");
    setEditing(false);
    onSaved();
  }

  if (editing) {
    return (
      <div className="narration-script-editor">
        <label>
          Current narration
          <textarea value={value} onChange={(event) => setValue(event.target.value)} rows={5} disabled={working} />
        </label>
        <small>{value.length} characters</small>
        {error && <p className="error" role="alert">{error}</p>}
        <div className="actions">
          <button onClick={() => void save()} disabled={working}>{working ? "Saving…" : "Save Changes"}</button>
          <button className="secondary" onClick={() => { setValue(scene.currentNarrationText); setEditing(false); }} disabled={working}>Cancel</button>
          <button className="secondary" onClick={() => { setValue(scene.originalNarrationText); }} disabled={working}>Restore Original</button>
        </div>
      </div>
    );
  }

  return (
    <div className="narration-script-readonly">
      <div>
        <span className="field-label">{edited ? "Current narration · User edited" : "Original source"}</span>
        <p>{scene.currentNarrationText}</p>
      </div>
      {edited && (
        <details className="narration-comparison">
          <summary>Compare original source</summary>
          <span className="field-label">Original source</span>
          <p>{scene.originalNarrationText}</p>
          <small>Edited {scene.narrationUpdatedAt ? stamp(scene.narrationUpdatedAt) : "by user"} · Revision {scene.narrationRevision}</small>
        </details>
      )}
    </div>
  );
}

export function AudioVersionList({ versions, selectedId, currentScriptHash, onSelect }: { versions: AudioVersion[]; selectedId?: string | null; currentScriptHash: string; onSelect: (id: string) => void }) {
  return (
    <aside className="audio-version-list">
      <span className="field-label">Version history</span>
      <div className="audio-version-items">
        {versions.length ? (
          versions.map((version) => {
            const outdated = version.scriptHash !== currentScriptHash;
            return (
              <button
                className={version.id === selectedId ? "is-selected" : ""}
                type="button"
                onClick={() => onSelect(version.id)}
                key={version.id}
              >
                <strong>Version {version.versionNumber}</strong>
                <small>{outdated ? "Outdated Script" : version.status === "APPROVED" ? "Approved" : version.status === "REJECTED" ? "Rejected" : version.status === "SELECTED" ? "Selected" : "Generated"}</small>
              </button>
            );
          })
        ) : (
          <p>No audio versions yet.</p>
        )}
      </div>
    </aside>
  );
}

export function AudioVersionReview({
  version,
  currentScriptHash,
  onAction,
  onEditScript,
  working,
}: {
  version?: AudioVersion;
  currentScriptHash: string;
  onAction: (action: "select" | "approve" | "reject") => void;
  onEditScript?: () => void;
  working: boolean;
}) {
  if (!version) return <section className="audio-version-review"><p>Select an audio version to review it here.</p></section>;
  const current = version.scriptHash === currentScriptHash;
  const isSelected = version.status === "SELECTED";
  const isApproved = version.status === "APPROVED";

  const providerLabel = version.provider === "gemini" ? "Google TTS (Gemini)" : version.provider === "elevenlabs" ? "ElevenLabs" : "ElevenLabs / Google TTS";

  return (
    <section className="audio-version-review">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Current review version</p>
          <h3>Version {version.versionNumber}</h3>
        </div>
        <span className={`status-badge ${current ? isApproved ? "status-approved" : isSelected ? "status-approved" : "status-generated" : "status-rejected"}`}>
          {current ? version.status === "READY" ? "Generated" : version.status[0] + version.status.slice(1).toLowerCase() : "Outdated Script"}
        </span>
      </div>
      <audio controls src={`/api/audio-versions/${version.id}`} />
      <dl className="audio-version-metadata">
        <div><dt>Generated</dt><dd>{stamp(version.createdAt)}</dd></div>
        <div><dt>Provider</dt><dd>{providerLabel}</dd></div>
        <div><dt>Model</dt><dd>{version.model || "V3 Bilingual"}</dd></div>
        <div><dt>Voice</dt><dd>Karthik</dd></div>
        <div><dt>Script</dt><dd>{current ? "Current script" : "Older script"}</dd></div>
        <div><dt>Duration</dt><dd>{(version.durationMs / 1000).toFixed(1)} sec</dd></div>
      </dl>
      <div className="audio-review-actions-bar">
        {onEditScript ? (
          <button type="button" className="secondary edit-script-left-btn" onClick={onEditScript} disabled={working}>
            Edit Script
          </button>
        ) : <div />}
        <div className="right-approve-reject-group">
          <button
            type="button"
            className="secondary"
            onClick={() => onAction("select")}
            disabled={working || isSelected || isApproved}
          >
            {isSelected ? "Selected" : "Select Version"}
          </button>
          <button onClick={() => onAction("approve")} disabled={working || !current || isApproved}>
            Approve
          </button>
          <button className="danger" onClick={() => onAction("reject")} disabled={working || isApproved}>
            Reject
          </button>
        </div>
      </div>
    </section>
  );
}

function VoiceSceneCard({ scene, versions }: { scene: Scene; versions: AudioVersion[] }) {
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string>();
  const [isEditingScript, setIsEditingScript] = useState(false);

  const initial = scene.selectedAudioVersionId ?? versions.find((version) => version.status === "APPROVED")?.id ?? versions.at(-1)?.id;
  const [selectedId, setSelectedId] = useState<string | undefined>(initial);

  useEffect(() => {
    const active = scene.selectedAudioVersionId ?? versions.find((version) => version.status === "APPROVED")?.id ?? versions.at(-1)?.id;
    if (active && (!selectedId || !versions.some((v) => v.id === selectedId))) {
      setSelectedId(active);
    }
  }, [scene.selectedAudioVersionId, versions, selectedId]);

  const selected = versions.find((version) => version.id === selectedId);

  async function request(url: string, init: RequestInit) {
    setWorking(true);
    setError(undefined);
    const response = await fetch(url, init);
    const data = await response.json().catch(() => ({}));
    setWorking(false);
    if (!response.ok) return setError(data.error?.message ?? "Could not update audio.");
    router.refresh();
  }

  async function reviewAction(action: "select" | "approve" | "reject") {
    if (!selected) return;
    await request(`/api/audio-versions/${selected.id}/review`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
  }

  return (
    <article className="voice-scene-card">
      <div className="voice-scene-heading">
        <div>
          <p className="eyebrow">Scene {String(scene.sceneNumber).padStart(2, "0")}</p>
          <h2>{scene.emotion ?? "Narration"}</h2>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {!isEditingScript && (
            <button
              type="button"
              className="secondary"
              onClick={() => setIsEditingScript(true)}
              disabled={working}
            >
              Edit Script
            </button>
          )}
          <button
            onClick={() =>
              void request(`/api/scenes/${scene.id}/tts`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ quality: "preview" }),
              })
            }
            disabled={working}
          >
            {working ? "Generating…" : versions.length ? "Generate New Audio" : "Generate Audio"}
          </button>
        </div>
      </div>
      <NarrationScriptEditor
        scene={scene}
        onSaved={() => router.refresh()}
        isEditing={isEditingScript}
        onEditToggle={setIsEditingScript}
      />
      {scene.currentNarrationText !== scene.originalNarrationText &&
        versions.some((version) => version.status === "APPROVED" && version.scriptHash !== scene.narrationScriptHash) && (
          <p className="outdated-script-callout">
            Scene {scene.sceneNumber} narration changed. Generate and approve a new audio version.
          </p>
        )}
      {error && <p className="error" role="alert">{error}</p>}
      <div className="audio-review-layout">
        <AudioVersionList versions={versions} selectedId={selectedId} currentScriptHash={scene.narrationScriptHash} onSelect={(id) => { setSelectedId(id); }} />
        <AudioVersionReview
          version={selected}
          currentScriptHash={scene.narrationScriptHash}
          onAction={(action) => void reviewAction(action)}
          onEditScript={() => setIsEditingScript(true)}
          working={working}
        />
      </div>
    </article>
  );
}

export function VoiceSceneCards({ scenes, audioVersions, voiceBible }: Props) {
  return (
    <section id="voice" className="voice-section">
      {voiceBible && (
        <section className="voice-direction">
          <p className="eyebrow">Voice Bible</p>
          <h2>Karthik</h2>
          <p>{voiceBible.voiceStyle} · {voiceBible.languageCode} · ElevenLabs / Google TTS</p>
        </section>
      )}
      {scenes.map((scene) => (
        <VoiceSceneCard key={scene.id} scene={scene} versions={audioVersions[scene.id] ?? []} />
      ))}
    </section>
  );
}
