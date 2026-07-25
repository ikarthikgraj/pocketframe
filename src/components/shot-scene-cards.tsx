"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Scene, SceneVersion } from "@/lib/db/repositories";
import type { ProjectReference } from "@/lib/db/repositories";
import { BeginnerHint } from "@/components/production-experience";
import { SceneReferenceSelector } from "@/components/scene-reference-selector";
import { DurationSegmentedControl } from "@/components/duration-segmented-control";

type Props = { projectId: string; references: ProjectReference[]; scenes: Scene[]; versions: Record<string, SceneVersion[]> };

const label: Record<SceneVersion["status"], string> = {
  QUEUED: "Pending",
  GENERATING: "Generating",
  READY: "Generated",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  FAILED: "Failed",
};

export function ShotSceneCards({ projectId, references, scenes, versions }: Props) {
  const router = useRouter();
  const [working, setWorking] = useState<string>();
  const [error, setError] = useState<string>();
  const [selectedSceneId, setSelectedSceneId] = useState(scenes[0]?.id);

  // Creative controls state
  const [model, setModel] = useState("Sora");
  const [quality, setQuality] = useState("720p");

  const active = Object.values(versions)
    .flat()
    .filter((version) => version.status === "QUEUED" || version.status === "GENERATING")
    .map((version) => version.id)
    .join(",");

  const polling = useRef(false);
  const selectedScene = scenes.find((scene) => scene.id === selectedSceneId) ?? scenes[0];

  useEffect(() => {
    if (!active) return;
    const poll = async () => {
      if (polling.current) return;
      polling.current = true;
      await Promise.all(active.split(",").filter(Boolean).map((id) => fetch(`/api/scene-versions/${id}/status`)));
      polling.current = false;
      router.refresh();
    };
    void poll();
    const id = window.setInterval(() => void poll(), 5_000);
    return () => window.clearInterval(id);
  }, [active, router]);

  async function json(url: string, init: RequestInit, id: string) {
    setWorking(id);
    setError(undefined);
    const response = await fetch(url, init);
    const data = await response.json().catch(() => ({}));
    setWorking(undefined);
    if (!response.ok) setError(data.error?.message ?? "Shot operation failed.");
    else router.refresh();
  }

  if (!selectedScene)
    return (
      <section className="voice-section">
        <p>No scenes are available yet. Complete Story Planning first.</p>
      </section>
    );

  const sceneVersions = versions[selectedScene.id] ?? [];
  const approvedCount = scenes.filter((scene) => scene.approvedVersionId).length;

  return (
    <section id="shots" className="voice-section fade-in">
      <BeginnerHint>Generate silent visuals, then approve the best version. Narration is added in Final Cut.</BeginnerHint>

      <div className="section-heading" style={{ marginBottom: 12 }}>
        <div>
          <p className="eyebrow">Shots workspace</p>
          <h2>Visual Shot Review</h2>
        </div>
        <span className="status-badge status-neutral">
          {approvedCount} of {scenes.length} shots approved
        </span>
      </div>

      {error && <p className="error" role="alert" style={{ marginBottom: 16 }}>{error}</p>}

      {/* Horizontal Scene selector */}
      <div className="scene-selector" role="tablist" aria-label="Visual shot scenes">
        {scenes.map((scene) => {
          const isSelected = selectedScene.id === scene.id;
          const isSceneApproved = Boolean(scene.approvedVersionId);
          const sceneState = versions[scene.id]?.at(-1)?.status;

          return (
            <button
              type="button"
              role="tab"
              aria-selected={isSelected}
              className={`clip-scene-tab ${isSelected ? "selected" : "secondary"}`}
              onClick={() => setSelectedSceneId(scene.id)}
              key={scene.id}
            >
              <span>Scene {String(scene.sceneNumber).padStart(2, "0")}</span>
              <span className={`status-badge status-${isSceneApproved ? "approved" : sceneState ? sceneState.toLowerCase() : "pending"}`} style={{ fontSize: 10, padding: "1px 5px" }}>
                {isSceneApproved ? "✓ Approved" : sceneState ? label[sceneState] : "Pending"}
              </span>
            </button>
          );
        })}
      </div>

      {/* Studio Canvas */}
      <StudioCanvas
        key={selectedScene.id}
        scene={selectedScene}
        versions={sceneVersions}
        working={working === selectedScene.id || sceneVersions.some((v) => working === v.id)}
        model={model}
        setModel={setModel}
        quality={quality}
        setQuality={setQuality}
        projectId={projectId}
        references={references}
        onError={setError}
        onAction={json}
      />
    </section>
  );
}

function StudioCanvas({
  scene,
  versions,
  working,
  model,
  setModel,
  quality,
  setQuality,
  projectId,
  references,
  onError,
  onAction,
}: {
  scene: Scene;
  versions: SceneVersion[];
  working: boolean;
  model: string;
  setModel: (m: string) => void;
  quality: string;
  setQuality: (q: string) => void;
  projectId: string;
  references: ProjectReference[];
  onError: (message: string | undefined) => void;
  onAction: (url: string, init: RequestInit, id: string) => Promise<void>;
}) {
  const selectedVersion = versions.find((v) => v.status === "APPROVED") ?? versions.at(-1);

  // Auto-generate default visual prompt if prompt is not explicitly set
  const defaultAutoPrompt =
    selectedVersion?.prompt ||
    scene.promptNotes ||
    `Cinematic 24fps shot, ${scene.cameraIntent ?? "measured push-in"}, ${scene.emotion ? scene.emotion.toLowerCase() + " tone," : ""} visual focus on: "${scene.exactText}"`;

  const [prompt, setPrompt] = useState(defaultAutoPrompt);
  const [negativePrompt, setNegativePrompt] = useState(selectedVersion?.negativePrompt ?? scene.negativePrompt ?? "blurry, text, artifacts, low resolution, audio instructions");
  const uploadRef = useRef<HTMLInputElement>(null);
  const [duration, setDuration] = useState<number | null>(scene.videoDurationSeconds);

  const isApproved = selectedVersion?.status === "APPROVED";

  const generate = () =>
    onAction(
      `/api/scenes/${scene.id}/video`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, provider: "mock", durationSeconds: duration }),
      },
      scene.id
    );

  const submitVideoUpload = async (file?: File) => {
    if (!file) return;
    const form = new FormData();
    form.set("file", file);
    form.set("prompt", prompt);
    await onAction(`/api/scenes/${scene.id}/upload`, { method: "POST", body: form }, scene.id);
    if (uploadRef.current) uploadRef.current.value = "";
  };

  async function updateDuration(value: number | null) {
    setDuration(value);
    const response = await fetch(`/api/scenes/${scene.id}/duration`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ durationSeconds: value }) });
    if (!response.ok) { const data = await response.json().catch(() => ({})); onError(data.error?.message ?? "Could not update video duration."); }
  }

  return (
    <article className={`higgsfield-studio ${isApproved ? "is-approved" : ""}`}>
      <div className="shot-review-grid">
        {/* Left Panel: Video Canvas & Preview */}
        <div className="canvas-preview-column">
          <div className="video-preview-frame">
            {selectedVersion?.videoPath ? (
              <video controls muted preload="metadata" src={`/api/scene-versions/${selectedVersion.id}/video`} key={selectedVersion.id} />
            ) : (
              <div className="canvas-placeholder">
                <span className="placeholder-icon">🎬</span>
                <strong>Scene {String(scene.sceneNumber).padStart(2, "0")} Canvas</strong>
                <p>Generate a silent shot when the approved voice is ready.</p>
              </div>
            )}
          </div>

          <div className="scene-narration-banner" style={{ marginTop: 12, padding: "10px 14px", background: "var(--surface-muted)", borderRadius: 8 }}>
            <span className="field-label">Exact Narration Context</span>
            <p style={{ margin: 0, fontSize: 13, color: "var(--text-primary)" }}>&ldquo;{scene.exactText}&rdquo;</p>
          </div>

          {/* Version History Chips */}
          {versions.length > 0 && (
            <div className="version-chips-row" style={{ marginTop: 12 }}>
              <span className="field-label" style={{ display: "inline-block", marginRight: 8 }}>Versions:</span>
              {versions.map((v) => (
                <span
                  key={v.id}
                  className={`version-chip ${v.id === selectedVersion?.id ? "active" : ""}`}
                  onClick={() => setPrompt(v.prompt ?? defaultAutoPrompt)}
                >
                  v{v.versionNumber} ({label[v.status]})
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right Panel: AI Studio Controls */}
        <div className="studio-controls-column">
          <div className="controls-header">
            <h3>Scene {String(scene.sceneNumber).padStart(2, "0")} Studio Controls</h3>
            <span className={`status-badge status-${selectedVersion ? selectedVersion.status.toLowerCase() : "pending"}`}>
              {selectedVersion ? label[selectedVersion.status] : "Pending"}
            </span>
          </div>

          <SceneReferenceSelector sceneId={scene.id} projectId={projectId} references={references} selectedReferenceIds={scene.selectedReferenceIds} disabled={working} onError={onError} />

          {/* Settings Grid: Model, Quality, Duration */}
          <div className="studio-settings-grid">
            <label>
              AI Model
              <select value={model} onChange={(e) => setModel(e.target.value)} disabled={working}>
                <option value="Sora">Sora Video Engine</option>
                <option value="Kling">Kling AI 1.5</option>
                <option value="Seedance">Seedance Studio</option>
              </select>
            </label>

            <label>
              Resolution / Quality
              <select value={quality} onChange={(e) => setQuality(e.target.value)} disabled={working}>
                <option value="480p">480p SD</option>
                <option value="720p">720p HD</option>
                <option value="1080p">1080p Full HD</option>
              </select>
            </label>

          </div>

          <DurationSegmentedControl value={duration} onChange={(value) => void updateDuration(value)} disabled={working} />

          {/* Visual Prompt Editor (Auto-generated default, editable by user) */}
          <label className="studio-field">
            Visual Prompt <span style={{ fontWeight: 400, color: "var(--brand)", fontSize: 11 }}>(Auto-generated, editable)</span>
            <small style={{ display: "block", marginBottom: 4 }}>Visual instructions for camera motion and composition</small>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              rows={3}
              disabled={working}
              placeholder="Describe camera movement, lighting, subject action..."
            />
          </label>

          {/* Negative Prompt */}
          <label className="studio-field">
            Negative Constraints
            <textarea
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              rows={1}
              disabled={working}
              placeholder="blurry, text, artifacts, low resolution..."
            />
          </label>

          {/* Action Toolbar */}
          <div className="studio-actions-toolbar">
            <button onClick={generate} disabled={working} className={working ? "is-working" : ""}>
              {working ? <span className="spinner" /> : null}
              {working ? "Generating Silent Shot…" : selectedVersion ? "Regenerate" : "Generate Silent Shot"}
            </button>

            <button className="secondary" onClick={() => uploadRef.current?.click()} disabled={working}>
              Upload Replacement
            </button>

            <input
              className="visually-hidden"
              ref={uploadRef}
              type="file"
              accept="video/mp4,.mp4"
              onChange={(e) => void submitVideoUpload(e.target.files?.[0])}
            />

            {selectedVersion && selectedVersion.status === "READY" && (
              <>
                <button
                  className="secondary"
                  onClick={() => onAction(`/api/scene-versions/${selectedVersion.id}/approve`, { method: "POST" }, selectedVersion.id)}
                  disabled={working}
                >
                  ✓ Approve Clip
                </button>
                <button
                  className="danger"
                  onClick={() =>
                    onAction(
                      `/api/scene-versions/${selectedVersion.id}/reject`,
                      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) },
                      selectedVersion.id
                    )
                  }
                  disabled={working}
                >
                  Reject
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}
