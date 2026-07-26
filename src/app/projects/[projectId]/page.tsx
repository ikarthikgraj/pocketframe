import { notFound } from "next/navigation";
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

export default async function ProjectWorkspace({ params }: { params: Promise<{ projectId: string }> }) {
  const project = repositories().getProject((await params).projectId);
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

  const initialTab = nextWorkflowTab({ storyReady, voiceReady, shotsReady });
  const story = <StoryPlanningSetup projectId={project.id} project={{ title: project.title, synopsis: project.synopsis, genre: project.genre, languageCode: project.languageCode, references: project.references }} productionBible={project.productionBible} scenes={scenes} status={project.status} />;
  return (
    <div className="workspace-shell">
      <header className="app-header"><Link className="brand" href="/" aria-label="Go to PocketFrame home"><span className="brand-mark">PF</span><span>PocketFrame <small>AI TRAILER STUDIO</small></span></Link></header>

      <main className="workspace-content">
        <WorkspaceTabs
          initialTab={initialTab}
          overview={
            <ProjectWorkspaceHeader
              title={project.title}
              genre={project.genre}
              language={project.languageCode}
              stage={displayProjectStatus(project.status)}
            />
          }
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
              content: <ShotSceneCards projectId={project.id} references={project.references} scenes={scenes} versions={versions} />,
            },
            {
              name: "Final Cut",
              ready: readiness.ready,
              blockedMessage: "Approve all shots first.",
              content: <FinalCutPanel projectId={project.id} title={project.title} scenes={scenes} ready={readiness.ready} render={render} />,
            },
          ]}
        />
      </main>
    </div>
  );
}
