"use client";

import type { PipelineItem, RecommendedAction } from "@/lib/production-ux";
import { useWorkspaceNavigation } from "@/components/workspace-navigation";
import { StageStatus } from "@/components/production-experience";

export function ProjectWorkspaceOverview({
  title,
  trailerDuration,
  progress,
  stage,
  action,
  pipeline,
}: {
  title: string;
  trailerDuration: string;
  progress: number;
  stage: string;
  action: RecommendedAction;
  pipeline: PipelineItem[];
}) {
  const navigate = useWorkspaceNavigation();

  return (
    <section className="workspace-overview fade-in">
      <div className="overview-top">
        <div>
          <h1>{title}</h1>
          <div className="overview-meta">
            <span>{trailerDuration}</span>
            <span>{stage}</span>
          </div>
        </div>
        <div className="overview-progress-pill">
          <span className="progress-value">{progress}%</span>
          <div className="mini-progress-track" role="progressbar" aria-label="Overall progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
            <span style={{ width: `${progress}%` }} />
          </div>
        </div>
      </div>

      {/* Compact inline pipeline steps */}
      <nav className="mini-pipeline" aria-label="Production pipeline">
        {pipeline.map((step, i) => (
          <div className={`mini-pipeline-step ${step.status.toLowerCase().replace(/\s+/g, "-")}`} key={step.number}>
            <span className="mini-step-dot">{step.status === "Complete" ? "✓" : i + 1}</span>
            <span className="mini-step-label">{step.name}</span>
            <StageStatus status={step.status} />
          </div>
        ))}
      </nav>

      {/* Recommended next action inline */}
      <div className="next-action-inline fade-in-delay">
        <div>
          <strong>{action.title}</strong>
          <span>{action.reason}</span>
        </div>
        <button type="button" onClick={() => navigate?.(action.targetTab)}>{action.buttonLabel}</button>
      </div>
    </section>
  );
}
