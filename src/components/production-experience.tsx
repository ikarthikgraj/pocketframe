"use client";

import { useState, type ReactNode } from "react";
import { useWorkspaceNavigation } from "@/components/workspace-navigation";
import type { ActivityItem, PipelineItem, ProductionStatus, RecommendedAction, TeamRole } from "@/lib/production-ux";

const statusClass = (status: ProductionStatus) => `stage-status ${status.toLowerCase().replace(/\s+/g, "-")}`;

export function StageStatus({ status }: { status: ProductionStatus }) { return <span className={statusClass(status)}>{status === "Complete" && "✓ "}{status}</span>; }

export function OverallProgressBar({ value, label = "Overall production progress" }: { value: number; label?: string }) {
  return <div className="overall-progress"><div className="overall-progress-label"><span>{label}</span><strong>{value}%</strong></div><div className="overall-progress-track" role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={value}><span style={{ width: `${value}%` }} /></div></div>;
}

export function ProductionPipeline({ stages }: { stages: PipelineItem[] }) { return <section className="production-pipeline" aria-label="Detailed production pipeline"><div className="pipeline-heading"><div><p className="eyebrow">Production pipeline</p><h2>From synopsis to trailer</h2></div><p>Follow the current stage, then take the recommended action.</p></div><div className="pipeline-scroll">{stages.map((stage) => <article className={`pipeline-stage ${stage.status.toLowerCase().replace(/\s+/g, "-")}`} key={stage.number} data-pipeline-stage={stage.name}><span className="pipeline-number">{stage.status === "Complete" ? "✓" : String(stage.number).padStart(2, "0")}</span><strong>{stage.name}</strong><StageStatus status={stage.status} /><small>{stage.message}</small>{stage.status === "Running" && <span className="indeterminate-progress" aria-label="In progress" />}</article>)}</div></section>; }

export function NextActionCard({ action }: { action: RecommendedAction }) { const navigate = useWorkspaceNavigation(); return <section className="next-action-card"><div><p className="eyebrow">Recommended next action</p><h2>{action.title}</h2><p><strong>Why:</strong> {action.reason}</p>{action.blocker && <p className="blocker-reason">{action.blocker}</p>}</div><button type="button" onClick={() => navigate?.(action.targetTab)}>{action.buttonLabel}</button></section>; }

export function ProductionTeamStatus({ roles }: { roles: TeamRole[] }) { return <section className="production-team"><div className="section-heading"><div><p className="eyebrow">AI production team</p><h2>Who is guiding this trailer</h2></div></div><div className="team-rows">{roles.map((role) => <div className="team-row" key={role.role}><strong>{role.role}</strong><span>{role.task}</span><StageStatus status={role.status} /></div>)}</div></section>; }

export function ActivityTimeline({ items }: { items: ActivityItem[] }) { return <section className="activity-timeline"><div className="section-heading"><div><p className="eyebrow">Project activity</p><h2>Recent production activity</h2></div></div><ol>{items.slice(0, 8).map((item, index) => <li key={`${item.timestamp}-${item.action}-${index}`} className={`activity-${item.tone}`}><span className="activity-icon">{item.tone === "complete" ? "✓" : item.tone === "failed" ? "!" : item.tone === "review" ? "•" : "·"}</span><div><strong>{item.action}{item.sceneNumber ? ` · Scene ${String(item.sceneNumber).padStart(2, "0")}` : ""}</strong><time dateTime={item.timestamp}>{new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(item.timestamp))}</time></div></li>)}</ol></section>; }

export function StageProgressList({ items }: { items: Array<{ label: string; status: ProductionStatus }> }) { return <div className="stage-progress-list">{items.map((item) => <div key={item.label}><span>{item.label}</span><StageStatus status={item.status} /></div>)}</div>; }

export function SubStageTabs({ label, stages, initialStage }: { label: string; stages: Array<{ id: string; label: string; status?: ProductionStatus; content: ReactNode }>; initialStage?: string }) {
  const [active, setActive] = useState(initialStage ?? stages[0]?.id);
  const selected = stages.find((stage) => stage.id === active) ?? stages[0];
  return <section className="substage-workspace"><nav className="substage-tabs" aria-label={label} role="tablist">{stages.map((stage) => <button type="button" role="tab" aria-selected={selected?.id === stage.id} aria-controls={`${label}-${stage.id}`} className={selected?.id === stage.id ? "selected" : "secondary"} onClick={() => setActive(stage.id)} key={stage.id}>{stage.label}{stage.status && <StageStatus status={stage.status} />}</button>)}</nav><div id={`${label}-${selected?.id}`} role="tabpanel">{selected?.content}</div></section>;
}

export function ReadinessChecklist({ items }: { items: Array<{ label: string; complete: boolean; detail: string }> }) { return <div className="readiness-checklist">{items.map((item) => <div key={item.label} className={item.complete ? "is-complete" : "is-blocked"}><span>{item.complete ? "✓" : "○"}</span><div><strong>{item.label}</strong><small>{item.detail}</small></div></div>)}</div>; }

export function RenderProgress({ status }: { status: "NOT_READY" | "READY" | "RENDERING" | "COMPLETE" | "FAILED" }) {
  const finished = status === "COMPLETE";
  const active = status === "RENDERING";
  const steps = ["Preparing approved clips", "Matching narration durations", "Removing source clip audio", "Attaching narration", "Mixing optional music", "Encoding final trailer", "Validating MP4"];
  return <section className="render-progress"><p className="eyebrow">Render progress</p><h3>{status === "RENDERING" ? "Assembling your trailer" : status === "COMPLETE" ? "Final trailer validated" : status === "FAILED" ? "Render needs another attempt" : "Render steps"}</h3><p>{active ? "The renderer is working. Detailed FFmpeg phase progress is not reported by the current backend." : finished ? "All render steps completed." : "Render begins after every narration and shot is approved."}</p><ol>{steps.map((step, index) => <li key={step} className={finished ? "complete" : active && index === 0 ? "active" : "waiting"}><span>{finished ? "✓" : active && index === 0 ? "…" : "○"}</span>{step}</li>)}</ol>{active && <span className="indeterminate-progress" aria-label="Rendering in progress" />}</section>;
}

export function BeginnerHint({ children }: { children: ReactNode }) { return <aside className="beginner-hint"><strong>Helpful context</strong><span>{children}</span></aside>; }
