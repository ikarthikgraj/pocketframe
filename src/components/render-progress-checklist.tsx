"use client";

import type { RenderVersion } from "@/lib/db/repositories";

export const renderStages = ["Validating approved scenes", "Preparing silent clips", "Matching scene durations", "Removing source audio", "Attaching approved narration", "Mixing optional music", "Encoding final trailer", "Validating output"] as const;
type StepStatus = "Waiting" | "Running" | "Complete" | "Failed";

export function renderStepStatuses(currentStage: number | null | undefined, failed = false): StepStatus[] {
  const stage = Math.max(1, Math.min(renderStages.length, currentStage ?? 1));
  return renderStages.map((_, index) => failed && index + 1 === stage ? "Failed" : index + 1 < stage ? "Complete" : index + 1 === stage ? "Running" : "Waiting");
}

export function RenderStepRow({ label, status, error }: { label: string; status: StepStatus; error?: string | null }) {
  return <li className={`render-step-row ${status.toLowerCase()}`}><span aria-hidden="true">{status === "Complete" ? "✓" : status === "Failed" ? "!" : ""}</span><div><strong>{label}</strong>{status === "Running" && <small>Running <i aria-label="Loading" /></small>}{status === "Waiting" && <small>Waiting</small>}{status === "Complete" && <small>Complete</small>}{status === "Failed" && <small>{error ?? "Failed"}</small>}</div></li>;
}

export function RenderProgressChecklist({ render, status = "RENDERING" }: { render?: RenderVersion; status?: "RENDERING" | "FAILED" }) {
  const stage = Math.max(1, Math.min(8, render?.currentStage ?? 1)); const failed = status === "FAILED"; const statuses = renderStepStatuses(stage, failed);
  return <section className="render-progress-checklist"><p className="eyebrow">Render progress</p><h3>Rendering final trailer</h3><p>PocketFrame is assembling your approved shots and narration.</p><strong className="render-step-count">Step {stage} of {renderStages.length}</strong><ol>{renderStages.map((label, index) => <RenderStepRow key={label} label={label} status={statuses[index]!} error={failed ? render?.errorMessage : undefined} />)}</ol>{render?.startedAt && <div className="render-meta">Elapsed time: {formatElapsed(render.startedAt)} · Render v{render.versionNumber} · final-v{render.versionNumber}.mp4</div>}</section>;
}

export function RenderSuccessSummary({ render, sceneCount }: { render: RenderVersion; sceneCount: number }) {
  return <section className="render-success-summary"><p className="eyebrow">Trailer ready</p><h3>TRAILER READY</h3><video controls preload="metadata" src={`/api/renders/${render.id}/video`} /><dl><div><dt>Duration</dt><dd>{render.durationMs ? `${(render.durationMs / 1000).toFixed(1)} sec` : "—"}</dd></div><div><dt>Format</dt><dd>1080 × 1920 · 24 fps</dd></div><div><dt>Codecs</dt><dd>H.264 · AAC</dd></div><div><dt>Scenes</dt><dd>{sceneCount}</dd></div><div><dt>Render version</dt><dd>v{render.versionNumber}</dd></div><div><dt>Filename</dt><dd>final-v{render.versionNumber}.mp4</dd></div></dl><a className="button" href={`/api/renders/${render.id}/video`} download={`pocketframe-final-v${render.versionNumber}.mp4`}>Download MP4</a><details><summary>Render details</summary><ol className="completed-render-details">{renderStages.map((stage) => <li key={stage}>✓ {stage}</li>)}</ol></details></section>;
}

const essentialMilestones = [
  { label: "Validated All Scenes", stageIdx: 0 },
  { label: "Audio & Music Synced", stageIdx: 4 },
  { label: "Durations Matched", stageIdx: 2 },
  { label: "1080×1920 MP4 Encoded", stageIdx: 6 },
] as const;

export function RenderDetailsDisclosure({ render }: { render: RenderVersion }) {
  const isComplete = render.status === "COMPLETE";
  const isFailed = render.status === "FAILED";
  const currentStage = Math.max(1, Math.min(renderStages.length, render.currentStage ?? 1));

  return (
    <div className="render-specs-card">
      <div className="specs-card-header">
        <span className="specs-title">
          {render.status === "RENDERING" ? "Live Render Progress" : "Production Specs"}
        </span>
        <span className="specs-tag">v{render.versionNumber}</span>
      </div>
      <ul className="completed-render-details">
        {essentialMilestones.map(({ label, stageIdx }) => {
          const stepNum = stageIdx + 1;
          const isDone = isComplete || stepNum <= currentStage;
          const isRunning = !isComplete && !isFailed && render.status === "RENDERING" && currentStage >= stageIdx && currentStage <= stageIdx + 1;
          const stepFailed = isFailed && currentStage === stepNum;

          return (
            <li key={label} className={`spec-row-item ${isDone ? "is-done" : isRunning ? "is-running" : stepFailed ? "is-failed" : "is-pending"}`}>
              <div className="spec-item-left">
                {isDone ? (
                  <span className="check-icon">✓</span>
                ) : isRunning ? (
                  <span className="running-icon">⚡</span>
                ) : stepFailed ? (
                  <span className="failed-icon">✕</span>
                ) : (
                  <span className="pending-icon">○</span>
                )}
                <span className="step-label">{label}</span>
              </div>
              <span className="spec-badge">
                {isDone ? "Verified" : isRunning ? "Running" : stepFailed ? "Failed" : "Pending"}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function RenderFailureState({ render, onRetry }: { render?: RenderVersion; onRetry: () => void }) {
  const stage = Math.max(1, Math.min(8, render?.currentStage ?? 1));
  return <section className="render-failure-state"><p className="eyebrow">Render failed</p><h3>Render failed</h3><p><strong>{renderStages[stage - 1]}</strong>{render?.errorMessage ? ` — ${render.errorMessage}` : " could not complete."}</p><button type="button" onClick={onRetry}>Retry Render</button><details><summary>Open render details</summary><pre>{render?.errorMessage ?? "No technical log was recorded."}</pre></details></section>;
}

function formatElapsed(startedAt: string) { return `${Math.max(0, Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000))}s`; }
