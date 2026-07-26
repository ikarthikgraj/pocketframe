"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Scene, SceneVersion } from "@/lib/db/repositories";
import type { ProjectReference } from "@/lib/db/repositories";
import { AspectRatioSelect, type AspectRatio } from "@/components/aspect-ratio-select";
import { SceneReferenceSelector } from "@/components/scene-reference-selector";
import { VideoDurationSlider } from "@/components/video-duration-slider";
import { VideoModelSelect } from "@/components/video-model-select";
import { type VideoModelId, videoModelLabel } from "@/lib/video/models";

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

  const [model, setModel] = useState<VideoModelId>("seedance-2-fast");

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
      <div className="section-heading" style={{ marginBottom: 14 }}>
        <div>
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
  projectId,
  references,
  onError,
  onAction,
}: {
  scene: Scene;
  versions: SceneVersion[];
  working: boolean;
  model: VideoModelId;
  setModel: (m: VideoModelId) => void;
  projectId: string;
  references: ProjectReference[];
  onError: (message: string | undefined) => void;
  onAction: (url: string, init: RequestInit, id: string) => Promise<void>;
}) {
  const defaultVersion = versions.find((v) => v.status === "APPROVED") ?? versions.at(-1);
  const [selectedVersionId, setSelectedVersionId] = useState<string | undefined>(defaultVersion?.id);
  const selectedVersion = versions.find((v) => v.id === selectedVersionId) ?? defaultVersion;

  const defaultAutoPrompt =
    selectedVersion?.prompt ||
    scene.promptNotes ||
    `Cinematic 24fps shot, ${scene.cameraIntent ?? "measured push-in"}, ${scene.emotion ? scene.emotion.toLowerCase() + " tone," : ""} visual focus on: "${scene.exactText}"`;

  const [prompt, setPrompt] = useState(defaultAutoPrompt);
  const uploadRef = useRef<HTMLInputElement>(null);
  const [duration, setDuration] = useState<number | null>(scene.videoDurationSeconds);
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");

  const isApproved = selectedVersion?.status === "APPROVED";

  const generate = () =>
    onAction(
      `/api/scenes/${scene.id}/video`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, provider: "mock", model, durationSeconds: duration, aspectRatio }),
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
        {/* Left Column: 9:16 Video Player */}
        <div className="canvas-preview-column">
          <div className="video-preview-frame">
            {selectedVersion?.videoPath ? (
              <video controls muted preload="metadata" src={`/api/scene-versions/${selectedVersion.id}/video`} key={selectedVersion.id} />
            ) : (
              <div className="canvas-placeholder">
                <span className="placeholder-icon">🎬</span>
                <strong>Scene {String(scene.sceneNumber).padStart(2, "0")} Canvas</strong>
                <p>Generate a silent shot for review.</p>
              </div>
            )}
          </div>

          <p className="scene-script-quote">&ldquo;{scene.exactText}&rdquo;</p>
        </div>

        {/* Right Column: Clean Studio Controls */}
        <div className="studio-controls-column">
          <div className="studio-settings-grid">
            <VideoModelSelect value={model} onChange={setModel} disabled={working} />
            <AspectRatioSelect value={aspectRatio} onChange={setAspectRatio} disabled={working} />
            <VideoDurationSlider value={duration} onChange={(value) => void updateDuration(value)} disabled={working} />
          </div>

          <SceneReferenceSelector sceneId={scene.id} projectId={projectId} references={references} selectedReferenceIds={scene.selectedReferenceIds} disabled={working} onError={onError} />

          {/* Interactive Generations Switcher */}
          {versions.length > 0 && (
            <div className="generations-switcher-panel">
              <span className="field-label">Generations History</span>
              <div className="generations-cards-row">
                {versions.map((v) => {
                  const active = v.id === selectedVersion?.id;
                  const isVerApproved = v.status === "APPROVED";
                  return (
                    <button
                      type="button"
                      key={v.id}
                      className={`generation-card-btn ${active ? "is-active" : ""} ${isVerApproved ? "is-approved" : ""}`}
                      onClick={() => {
                        setSelectedVersionId(v.id);
                        setPrompt(v.prompt ?? defaultAutoPrompt);
                      }}
                    >
                      <span className="ver-num">v{v.versionNumber}</span>
                      <span className={`ver-status-badge status-${v.status.toLowerCase()}`}>
                        {isVerApproved ? "✓ Approved" : label[v.status]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <label className="studio-field">
            <div className="studio-field-header">
              <span>Visual Prompt</span>
              <small className="char-count">{prompt.length} / 3999</small>
            </div>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value.slice(0, 3999))}
              maxLength={3999}
              rows={3}
              disabled={working}
              className="fixed-prompt-textarea"
              placeholder="Describe camera movement, lighting, subject action..."
            />
          </label>

          {/* Action Bar (Generate on Left, Upload & Approve on Right) */}
          <div className="studio-actions-toolbar">
            <button onClick={generate} disabled={working} className={working ? "is-working" : ""}>
              {working ? "Generating…" : selectedVersion ? "Regenerate" : "Generate Shot"}
            </button>

            <div className="right-action-group">
              <button type="button" className="secondary" onClick={() => uploadRef.current?.click()} disabled={working}>
                Upload Video
              </button>

              {selectedVersion && (
                <>
                  <button
                    className="button-success-solid"
                    onClick={() => onAction(`/api/scene-versions/${selectedVersion.id}/approve`, { method: "POST" }, selectedVersion.id)}
                    disabled={working || isApproved}
                  >
                    {isApproved ? "✓ Approved" : "Approve Shot"}
                  </button>
                  {selectedVersion.status === "REJECTED" ? (
                    <button
                      className="secondary"
                      onClick={() =>
                        onAction(
                          `/api/scene-versions/${selectedVersion.id}/approve`,
                          { method: "POST" },
                          selectedVersion.id
                        )
                      }
                      disabled={working}
                    >
                      Un-reject
                    </button>
                  ) : (
                    <button
                      className="danger"
                      onClick={() =>
                        onAction(
                          `/api/scene-versions/${selectedVersion.id}/reject`,
                          { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) },
                          selectedVersion.id
                        )
                      }
                      disabled={working || isApproved}
                    >
                      Reject
                    </button>
                  )}
                </>
              )}
            </div>

            <input
              className="visually-hidden"
              ref={uploadRef}
              type="file"
              accept="video/mp4,.mp4"
              onChange={(e) => void submitVideoUpload(e.target.files?.[0])}
            />
          </div>
        </div>
      </div>
    </article>
  );
}
