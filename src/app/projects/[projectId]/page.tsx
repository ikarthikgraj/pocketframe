import { notFound, redirect } from "next/navigation";
import { repositories } from "@/lib/db";
import { WorkspaceTabs } from "@/components/workspace-tabs";
import { nextWorkflowTab } from "@/lib/workflow";
import { StoryPlanningSetup } from "@/components/story-planning-setup";
import { VoiceSceneCards } from "@/components/voice-scene-cards";
import { ShotSceneCards } from "@/components/shot-scene-cards";
import { FinalCutPanel } from "@/components/final-cut-panel";
import { ProjectWorkspaceHeader } from "@/components/project-workspace-header";
import { deriveMilestones, displayProjectStatus, nextRecommendedAction, overallProgress } from "@/lib/production-ux";
import Link from "next/link";

export default async function ProjectWorkspace({ params, searchParams }: { params: Promise<{ projectId: string }>; searchParams: Promise<{ tab?: string; locked?: string }> }) {
  const { projectId } = await params;
  const project = repositories().getProject(projectId);
  if (!project) notFound();

  const scenes = repositories().listScenes(project.id);
  const audioVersions = Object.fromEntries(scenes.map((scene) => [scene.id, repositories().listAudioVersions(scene.id)]));
  const versions = Object.fromEntries(scenes.map((scene) => [scene.id, repositories().listSceneVersions(scene.id)]));
  const readiness = repositories().getRenderReadiness(project.id);
  const render = repositories().getLatestRenderVersion(project.id);

  const ux = { project, scenes, audioVersions, versions, render };
  const milestones = deriveMilestones(ux);
  const storyReady = milestones.storyComplete;
  const voiceReady = milestones.voiceComplete;
  const shotsReady = milestones.shotsComplete;
  const narrationApproved = scenes.filter((scene) => audioVersions[scene.id]?.some((version) => version.status === "APPROVED" && version.scriptHash === scene.narrationScriptHash)).length;
  const shotsApproved = scenes.filter((scene) => scene.approvedVersionId === versions[scene.id]?.at(-1)?.id && versions[scene.id]?.at(-1)?.status === "APPROVED").length;
  const query = await searchParams;
  if (query.tab === "final-cut" && !readiness.ready) redirect(`/projects/${project.id}?tab=${narrationApproved < scenes.length ? "voice" : "shots"}&locked=final-cut`);

  const initialTab = query.tab === "voice" ? "Voice" : query.tab === "shots" ? "Shots" : nextWorkflowTab({ storyReady, voiceReady, shotsReady });
  const story = <StoryPlanningSetup projectId={project.id} project={{ title: project.title, synopsis: project.synopsis, genre: project.genre, languageCode: project.languageCode, references: project.references }} productionBible={project.productionBible} scenes={scenes} status={project.status} />;
  return (
    <div className="workspace-shell">
      <header className="app-header"><Link className="brand" href="/" aria-label="Go to PocketFrame home"><span className="brand-mark">PF</span><span>PocketFrame <small>AI TRAILER STUDIO</small></span></Link></header>

      <main className="workspace-content">
        <WorkspaceTabs
          initialTab={initialTab}
          overview={<><ProjectWorkspaceHeader title={project.title} genre={project.genre} language={project.languageCode} progress={overallProgress(milestones)} stage={displayProjectStatus(project.status)} action={nextRecommendedAction(ux)} />{query.locked === "final-cut" && <p className="tab-hint">Final Cut is locked. Approve all narration and shots to unlock Final Cut.</p>}</>}
          stages={[
            { name: "Story", ready: storyReady, content: story },
            {
              name: "Voice",
              ready: storyReady,
              blockedMessage: "Complete Story Planning first.",
              content: <VoiceSceneCards projectId={project.id} scenes={scenes} audioVersions={audioVersions} voiceBible={project.voiceBible} />,
            },
            {
              name: "Shots",
              ready: voiceReady,
              blockedMessage: "Approve voice narration first. Visual shots are timed to approved narration.",
              content: <ShotSceneCards projectId={project.id} references={project.references} scenes={scenes} versions={versions} defaultDuration={project.defaultVideoDurationSeconds ?? 8} />,
            },
            {
              name: "Final Cut",
              ready: readiness.ready,
              blockedMessage: "Approve all narration and shots to unlock Final Cut.",
              lockCounts: { narrationApproved, shotsApproved, totalScenes: scenes.length },
              content: <FinalCutPanel projectId={project.id} title={project.title} scenes={scenes} ready={readiness.ready} render={render} />,
            },
          ]}
        />
      </main>
    </div>
  );
}
