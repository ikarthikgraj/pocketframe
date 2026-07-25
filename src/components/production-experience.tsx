"use client";

import { useState, type ReactNode } from "react";
import { useWorkspaceNavigation } from "@/components/workspace-navigation";
import { GuidanceTip } from "@/components/guidance-tip";
import type { PipelineItem, ProductionStatus, RecommendedAction } from "@/lib/production-ux";

const statusClass = (status: ProductionStatus) => `stage-status ${status.toLowerCase().replace(/\s+/g, "-")}`;

export function StageStatus({ status }: { status: ProductionStatus }) {
  return <span className={statusClass(status)}>{status === "Complete" && "✓ "}{status}</span>;
}

export function OverallProgressBar({ value, label = "Overall production progress" }: { value: number; label?: string }) {
  return (
    <div className="overall-progress">
      <div className="overall-progress-label">
        <span>{label}</span>
        <strong>{value}%</strong>
      </div>
      <div className="overall-progress-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}>
        <span style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

export function ProductionPipeline({ stages }: { stages: PipelineItem[] }) {
  return (
    <nav className="mini-pipeline" aria-label="Production pipeline">
      {stages.map((stage, i) => (
        <div className={`mini-pipeline-step ${stage.status.toLowerCase().replace(/\s+/g, "-")}`} key={stage.number}>
          <span className="mini-step-dot">{stage.status === "Complete" ? "✓" : i + 1}</span>
          <span className="mini-step-label">{stage.name}</span>
          <StageStatus status={stage.status} />
        </div>
      ))}
    </nav>
  );
}

export function NextActionCard({ action }: { action: RecommendedAction }) {
  const navigate = useWorkspaceNavigation();
  return (
    <section className="next-action-card">
      <div>
        <p className="eyebrow">Recommended next action</p>
        <h2>{action.title}</h2>
        <p><strong>Why:</strong> {action.reason}</p>
        {action.blocker && <p className="blocker-reason">{action.blocker}</p>}
      </div>
      <button type="button" onClick={() => navigate?.(action.targetTab)}>{action.buttonLabel}</button>
    </section>
  );
}

export function StageProgressList({ items }: { items: Array<{ label: string; status: ProductionStatus }> }) {
  return (
    <div className="stage-progress-list">
      {items.map((item) => (
        <div key={item.label}>
          <span>{item.label}</span>
          <StageStatus status={item.status} />
        </div>
      ))}
    </div>
  );
}

export function SubStageTabs({ label, stages, initialStage }: { label: string; stages: Array<{ id: string; label: string; status?: ProductionStatus; content: ReactNode }>; initialStage?: string }) {
  const [active, setActive] = useState(initialStage ?? stages[0]?.id);
  const selected = stages.find((stage) => stage.id === active) ?? stages[0];
  return (
    <section className="substage-workspace">
      <nav className="substage-tabs" aria-label={label} role="tablist">
        {stages.map((stage) => (
          <button type="button" role="tab" aria-selected={selected?.id === stage.id} aria-controls={`${label}-${stage.id}`} className={selected?.id === stage.id ? "selected" : "secondary"} onClick={() => setActive(stage.id)} key={stage.id}>
            {stage.label}
            {stage.status && <StageStatus status={stage.status} />}
          </button>
        ))}
      </nav>
      <div id={`${label}-${selected?.id}`} role="tabpanel">{selected?.content}</div>
    </section>
  );
}

export function ReadinessChecklist({ items }: { items: Array<{ label: string; complete: boolean; detail: string }> }) {
  return (
    <div className="readiness-checklist">
      {items.map((item) => (
        <div key={item.label} className={item.complete ? "is-complete" : "is-blocked"}>
          <span>{item.complete ? "✓" : "○"}</span>
          <div>
            <strong>{item.label}</strong>
            <small>{item.detail}</small>
          </div>
        </div>
      ))}
    </div>
  );
}

export function BeginnerHint({ children }: { children: ReactNode }) {
  return <GuidanceTip>{children}</GuidanceTip>;
}
