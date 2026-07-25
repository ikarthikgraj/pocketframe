"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { RenderVersion, Scene } from "@/lib/db/repositories";
import { BeginnerHint, ReadinessChecklist, RenderProgress, StageStatus } from "@/components/production-experience";

export function FinalCutPanel({
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

  const approvedVoices = scenes.filter((scene) => scene.status === "TTS_APPROVED" || ["VIDEO_QUEUED", "VIDEO_GENERATING", "VIDEO_REVIEW", "APPROVED"].includes(scene.status)).length;
  const approvedScenes = scenes.filter((scene) => scene.approvedVersionId).length;

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
    if (!response.ok) setError(data.error?.message ?? "Render failed.");
    else router.refresh();
  }

  const status = render?.status ?? (ready ? "READY" : "NOT_READY");

  return (
    <section id="final-cut" className="export-gate">
      <BeginnerHint>The 30–40s trailer can only render after voice narration and all video clips are approved.</BeginnerHint>

      {/* Readiness & Checklist */}
      <section className="final-readiness">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Final Cut Readiness</p>
            <h2>Assembly Checklist</h2>
          </div>
          <StageStatus status={ready ? "Ready" : "Blocked"} />
        </div>
        <ReadinessChecklist
          items={[
            { label: "Story plan complete", complete: scenes.length > 0, detail: `${scenes.length} scenes planned` },
            { label: "Narration approved", complete: approvedVoices === scenes.length && scenes.length > 0, detail: `${approvedVoices}/${scenes.length} scenes approved` },
            { label: "Visual clips approved", complete: approvedScenes === scenes.length && scenes.length > 0, detail: `${approvedScenes}/${scenes.length} scenes approved` },
            { label: "Background Music", complete: true, detail: "Optional — upload custom audio or render silent background" },
          ]}
        />
        {!ready && <p className="review-callout">Approve voice narration and one clip per scene to render.</p>}
      </section>

      {/* Export Panel */}
      <section className="final-export">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Trailer Export</p>
            <h2>Render Final MP4 Trailer (30–40s)</h2>
          </div>
          <span className={`status-badge ${ready ? "status-approved" : "status-pending"}`}>
            {status === "NOT_READY" ? "Not ready" : status[0] + status.slice(1).toLowerCase()}
          </span>
        </div>

        <article className="render-card">
          <div>
            <p className="eyebrow">Trailer Master</p>
            <h3>{title}</h3>
            <p className="title-preview">1080 × 1920 Vertical · 24 fps · H.264 · AAC</p>
          </div>
          <div>
            <label className="music-upload">
              Optional background music
              <input
                ref={musicRef}
                type="file"
                accept="audio/mpeg,audio/aac,audio/wav,audio/mp4,.mp3,.m4a,.aac,.wav"
                onChange={(event) => setMusic(event.target.files?.[0])}
              />
              <span>{music?.name ?? "No music file selected"}</span>
            </label>

            <label className="subtitle-toggle">
              <input type="checkbox" checked={subtitles} onChange={(event) => setSubtitles(event.target.checked)} /> Burn Subtitles onto trailer
            </label>

            <div className="actions">
              <button onClick={() => void renderTrailer()} disabled={!ready || working}>
                {working ? "Encoding final trailer…" : "Render Final Trailer"}
              </button>
            </div>
            {!ready && <small className="blocked-copy">Rendering is disabled until all readiness items pass.</small>}
          </div>
        </article>

        <RenderProgress status={status} />

        {error && <p className="error" role="alert">{error}</p>}
        {render?.status === "FAILED" && <p className="error" role="alert">{render.errorMessage}</p>}

        {render?.status === "COMPLETE" && (
          <div className="final-player">
            <video controls preload="metadata" src={`/api/renders/${render.id}/video`} />
            <div>
              <p className="eyebrow">Trailer Master Ready</p>
              <p>
                Duration: {render.durationMs ? `${(render.durationMs / 1000).toFixed(1)}s` : "30–40s"} · 1080 × 1920 · H.264/AAC · Render v{render.versionNumber}
              </p>
              <a className="button" href={`/api/renders/${render.id}/video`} download={`pocketframe-final-v${render.versionNumber}.mp4`}>
                Download MP4 Trailer
              </a>
            </div>
          </div>
        )}
      </section>
    </section>
  );
}
