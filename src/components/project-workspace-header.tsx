import Link from "next/link";
import { StageStatus } from "@/components/production-experience";
import type { ProductionStatus, RecommendedAction } from "@/lib/production-ux";

export function ProjectWorkspaceHeader({ title, genre, language, stage, progress, action }: { title: string; genre: string; language: string; stage: string; progress: number; action: RecommendedAction }) {
  return <section className="project-workspace-header"><div className="workspace-header-top"><Link className="back-link" href="/projects">← Back to My Projects</Link><StageStatus status={stage as ProductionStatus} /></div><div className="workspace-header-content"><div><h1>{title}</h1><p className="workspace-meta"><span>{genre}</span><span>{language}</span><span>{stage}</span></p></div><div className="workspace-progress"><div><span>Overall progress</span><strong>{progress}%</strong></div><span className="compact-progress-bar"><i style={{ width: `${progress}%` }} /></span></div></div><div className="workspace-next-action"><div><span className="eyebrow">Next recommended action</span><strong>{action.title}</strong><p>{action.reason}</p></div><span>{action.buttonLabel}</span></div></section>;
}
