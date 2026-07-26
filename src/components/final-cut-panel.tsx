"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RenderVersion, Scene } from "@/lib/db/repositories";
import { GuidanceTip } from "@/components/guidance-tip";
import { ReadinessChecklist, StageStatus } from "@/components/production-experience";
import { RenderFailureState, RenderProgressChecklist, RenderDetailsDisclosure } from "@/components/render-progress-checklist";

export function FinalCutWorkspace({
  projectId,
  title,
  scenes,
  ready,
  render,
}: {
  projectId: string;
  title: string;
  scenes: Scene[];
  ready: boolean;
  render?: RenderVersion;
}) {
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string>();
  const [subtitles, setSubtitles] = useState(false);
  const [music, setMusic] = useState<File>();
  const musicRef = useRef<HTMLInputElement>(null);

  const approvedVoices = scenes.filter(
    (scene) => scene.status === "TTS_APPROVED" || ["VIDEO_QUEUED", "VIDEO_GENERATING", "VIDEO_REVIEW", "APPROVED"].includes(scene.status)
  ).length;
  const approvedScenes = scenes.filter((scene) => scene.approvedVersionId).length;
  const status = working ? "RENDERING" : render?.status ?? (ready ? "READY" : "NOT_READY");

  useEffect(() => {
    if (render?.status !== "RENDERING" && !working) return;
    const timer = window.setInterval(() => {
      router.refresh();
    }, 1_000);
    return () => window.clearInterval(timer);
  }, [render?.status, working, router]);

  async function renderTrailer() {
    setWorking(true);
    setError(undefined);
    const form = new FormData();
    form.set("title", title);
    form.set("cta", "Listen now on Pocket FM");
    form.set("subtitles", String(subtitles));
    if (music) form.set("music", music);

    const response = await fetch(`/api/projects/${projectId}/render`, { method: "POST", body: form });
    const data = await response.json().catch(() => ({}));
    setWorking(false);
    if (!response.ok) {
      setError(data.error?.message ?? "Render failed.");
      if (data.render) router.refresh();
    } else {
      router.refresh();
    }
  }

  return (
    <section id="final-cut" className="final-cut-workspace">
      <GuidanceTip>Preview the approved audio and video versions before rendering.</GuidanceTip>
      <div className="final-cut-grid">
        {/* Left Column: Readiness & Render Options */}
        <section className="final-cut-controls">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Readiness</p>
              <h2>Final Cut</h2>
            </div>
            <StageStatus status={ready ? "Ready" : "Blocked"} />
          </div>

          <ReadinessChecklist
            items={[
              { label: "Story Plan", complete: scenes.length > 0, detail: `${scenes.length} scenes planned` },
              { label: "Narration", complete: approvedVoices === scenes.length && scenes.length > 0, detail: `${approvedVoices}/${scenes.length} approved` },
              { label: "Visual Shots", complete: approvedScenes === scenes.length && scenes.length > 0, detail: `${approvedScenes}/${scenes.length} approved` },
            ]}
          />

          {render && <RenderDetailsDisclosure render={render} />}

          {!ready && <p className="review-callout">Approve narration and one silent clip per scene to render.</p>}

          <div className="final-cut-options">
            {/* Custom Music Uploader */}
            <div className="custom-music-picker">
              <span className="compact-label">Optional Background Music</span>
              <div className="music-picker-box">
                <button type="button" className="secondary music-upload-btn" onClick={() => musicRef.current?.click()} disabled={working}>
                  🎵 {music ? "Change Audio Track" : "Upload Audio Track"}
                </button>
                {music ? (
                  <div className="selected-music-chip">
                    <span className="music-name">🎵 {music.name}</span>
                    <button
                      type="button"
                      className="remove-music-btn"
                      onClick={() => {
                        setMusic(undefined);
                        if (musicRef.current) musicRef.current.value = "";
                      }}
                      title="Remove music"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <span className="no-music-hint">No background music added</span>
                )}
                <input
                  ref={musicRef}
                  type="file"
                  className="visually-hidden"
                  accept="audio/mpeg,audio/aac,audio/wav,audio/mp4,.mp3,.m4a,.aac,.wav"
                  onChange={(event) => setMusic(event.target.files?.[0])}
                />
              </div>
            </div>

            {/* Custom Subtitle Switch */}
            <label className="subtitle-switch-label">
              <div className="switch-text">
                <strong>Burn Subtitles</strong>
                <small>Overlay vertical caption text onto the final video</small>
              </div>
              <input
                type="checkbox"
                checked={subtitles}
                onChange={(event) => setSubtitles(event.target.checked)}
                className="visually-hidden"
              />
              <span className={`custom-toggle-switch ${subtitles ? "is-active" : ""}`}>
                <span className="toggle-handle" />
              </span>
            </label>

            {/* Render Button on Left if no completed render yet */}
            {render?.status !== "COMPLETE" && (
              <button className="render-submit-btn" onClick={() => void renderTrailer()} disabled={!ready || working}>
                {working ? "Encoding…" : render ? "Re-render" : "Render"}
              </button>
            )}
          </div>

          {error && <p className="error" role="alert" style={{ marginTop: 12 }}>{error}</p>}
          {status === "RENDERING" && <RenderProgressChecklist render={render} />}
          {render?.status === "FAILED" && !working && <RenderFailureState render={render} onRetry={() => void renderTrailer()} />}
        </section>

        {/* Right Column: Final Video Preview */}
        <section className="final-cut-preview">
          <div className="section-heading" style={{ width: "100%" }}>
            <div>
              <p className="eyebrow">Final Preview</p>
              <h2>{render?.status === "COMPLETE" ? title : "Awaiting render"}</h2>
            </div>
            <span className="status-badge status-neutral">
              {status === "NOT_READY" ? "Not ready" : status[0] + status.slice(1).toLowerCase()}
            </span>
          </div>

          {render?.status === "COMPLETE" ? (
            <>
              <video controls preload="metadata" src={`/api/renders/${render.id}/video`} />
              <dl className="final-preview-metadata">
                <div><dt>Duration</dt><dd>{render.durationMs ? `${(render.durationMs / 1000).toFixed(1)} sec` : "—"}</dd></div>
                <div><dt>Format</dt><dd>1080 × 1920 · H.264</dd></div>
                <div><dt>Scenes</dt><dd>{scenes.length}</dd></div>
              </dl>
              <div className="final-preview-actions">
                <button className="white-rerender-btn" onClick={() => void renderTrailer()} disabled={!ready || working}>
                  {working ? "Encoding…" : "Re-render"}
                </button>
                <a className="button primary-download-btn" href={`/api/renders/${render.id}/video`} download={`pocketframe-final-v${render.versionNumber}.mp4`}>
                  Download MP4
                </a>
              </div>
            </>
          ) : (
            <div className="final-preview-empty">
              <span>▶</span>
              <strong>Final trailer preview</strong>
              <p>Your vertical MP4 will appear here after a successful render.</p>
            </div>
          )}
        </section>
      </div>
    </section>
  );
}

export function FinalCutPanel(props: { projectId: string; title: string; scenes: Scene[]; ready: boolean; render?: RenderVersion }) {
  return <FinalCutWorkspace {...props} />;
}
