"use client";

import type { ActivityItem, PipelineItem, RecommendedAction, TeamRole } from "@/lib/production-ux";
import { ActivityTimeline, NextActionCard, OverallProgressBar, ProductionPipeline, ProductionTeamStatus } from "@/components/production-experience";

export function ProjectWorkspaceOverview({ title, genre, language, trailerDuration, progress, stage, action, pipeline, roles, activity }: { title: string; genre: string; language: string; trailerDuration: string; progress: number; stage: string; action: RecommendedAction; pipeline: PipelineItem[]; roles: TeamRole[]; activity: ActivityItem[] }) {
  return <><section className="workspace-overview"><div><p className="eyebrow">Trailer production workspace</p><h1>{title}</h1><div className="overview-meta"><span>{genre}</span><span>{language}</span><span>{trailerDuration}</span><span>Current stage: {stage}</span></div></div><OverallProgressBar value={progress} /></section><ProductionPipeline stages={pipeline} /><div className="overview-grid"><NextActionCard action={action} /><ProductionTeamStatus roles={roles} /></div><ActivityTimeline items={activity} /></>;
}
