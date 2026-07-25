"use client";

import type { PipelineItem, RecommendedAction, TeamRole } from "@/lib/production-ux";
import { NextActionCard, OverallProgressBar, ProductionPipeline, ProductionTeamStatus } from "@/components/production-experience";

export function ProjectWorkspaceOverview({
  title,
  genre,
  language,
  trailerDuration,
  progress,
  stage,
  action,
  pipeline,
  roles,
}: {
  title: string;
  genre: string;
  language: string;
  trailerDuration: string;
  progress: number;
  stage: string;
  action: RecommendedAction;
  pipeline: PipelineItem[];
  roles: TeamRole[];
}) {
  return (
    <>
      <section className="workspace-overview">
        <div>
          <p className="eyebrow">AI Trailer Production Studio</p>
          <h1>{title}</h1>
          <div className="overview-meta">
            <span>{genre}</span>
            <span>{language}</span>
            <span>{trailerDuration}</span>
            <span>Current stage: {stage}</span>
          </div>
        </div>
        <OverallProgressBar value={progress} />
      </section>
      <ProductionPipeline stages={pipeline} />
      <div className="overview-grid">
        <NextActionCard action={action} />
        <ProductionTeamStatus roles={roles} />
      </div>
    </>
  );
}
