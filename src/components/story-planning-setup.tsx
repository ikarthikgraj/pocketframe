"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductionBible } from "@/lib/domain/contracts";
import type { Scene } from "@/lib/db/repositories";
import { BeginnerHint, StageProgressList, SubStageTabs } from "@/components/production-experience";

type Props = { projectId: string; project: { title: string; synopsis: string; genre: string; languageCode: string }; productionBible: ProductionBible | null; scenes: Scene[]; status: string };
const sourceLabel = (value: "FROM_SYNOPSIS" | "AI_INFERRED") => value === "FROM_SYNOPSIS" ? "From synopsis" : "AI inferred";

export function StoryPlanningSetup({ projectId, project, productionBible, scenes, status }: Props) {
  const router = useRouter();
  const [working, setWorking] = useState(false); const [error, setError] = useState<string>();
  async function action(path: string) {
    setWorking(true); setError(undefined);
    const response = await fetch(`/api/projects/${projectId}/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: path === "analyze" ? JSON.stringify({ maxScenes: 6 }) : undefined });
    const data = await response.json(); setWorking(false);
    if (!response.ok) return setError(data.error?.message ?? "Could not complete this action.");
    router.refresh();
  }
  const storyStatus = productionBible ? (status === "BIBLE_READY" ? "Review Required" as const : "Complete" as const) : status === "ANALYZING" ? "Running" as const : "Ready" as const;
  const summary = <StageProgressList items={[
    { label: "Story Input", status: "Complete" },
    { label: "Production Bible", status: storyStatus },
    { label: "Characters", status: productionBible ? storyStatus : "Waiting" },
    { label: "Environments", status: productionBible ? storyStatus : "Waiting" },
    { label: "Scene Planning", status: productionBible ? storyStatus : "Waiting" },
  ]} />;
  const source = <section className="story-input-panel"><div className="section-heading"><div><p className="eyebrow">Story Input</p><h2>Original source</h2><p>This is the exact source used for narration. It stays unchanged through production.</p></div></div><div className="story-input-meta"><div><span className="field-label">Title</span><strong>{project.title}</strong></div><div><span className="field-label">Genre</span><strong>{project.genre}</strong></div><div><span className="field-label">Language</span><strong>{project.languageCode}</strong></div><div><span className="field-label">Trailer duration</span><strong>{productionBible ? `${productionBible.trailerDurationSeconds}s` : "Set after analysis"}</strong></div></div><p className="synopsis">{project.synopsis}</p></section>;
  const bible = !productionBible ? <section className="story-empty"><p className="eyebrow">Production Bible</p><h2>Build the production-ready plan</h2><p>{status === "ANALYZING" ? "Analyzing the synopsis…" : "Generate the story direction and exact narration scenes from the approved source synopsis."}</p>{error && <p className="error" role="alert">{error}</p>}<button onClick={() => action("analyze")} disabled={working || status === "ANALYZING"}>{working || status === "ANALYZING" ? "Analyzing synopsis…" : "Generate Production Bible"}</button></section> : <section className="planning-panel"><div className="section-heading"><div><p className="eyebrow">Production Bible</p><h2>Creative direction, grounded in the synopsis</h2></div>{status === "BIBLE_READY" && <button onClick={() => action("approve-bible")} disabled={working}>{working ? "Approving…" : "Approve Production Bible"}</button>}</div>{error && <p className="error" role="alert">{error}</p>}<article className="bible-summary"><BibleField label="Premise" value={productionBible.premise.text} source={productionBible.premise.groundedness} /><BibleField label="Hook" value={productionBible.hook.text} source={productionBible.hook.groundedness} /><BibleField label="Conflict" value={productionBible.conflict.text} source={productionBible.conflict.groundedness} /></article><div className="metadata-row"><span>{productionBible.tone.text}</span><span>{productionBible.mood.text}</span>{productionBible.themes.map((theme) => <span key={theme.text}>{theme.text}</span>)}</div>{status === "BIBLE_READY" && <p className="review-callout">Review required: approve this plan before narration generation can begin.</p>}</section>;
  const characters = productionBible ? <DiscoveryList eyebrow="Character Discovery" title="Character references" items={productionBible.characters.map((character) => ({ title: character.name, detail: `${character.description.text} · ${sourceLabel(character.description.groundedness)}` }))} /> : <EmptyDiscovery title="Characters are waiting for the Production Bible." />;
  const environments = productionBible ? <DiscoveryList eyebrow="Environment Discovery" title="Environment references" items={productionBible.environments.map((environment) => ({ title: environment.name, detail: `${environment.description.text} · ${sourceLabel(environment.description.groundedness)}` }))} /> : <EmptyDiscovery title="Environments are waiting for the Production Bible." />;
  const plan = productionBible ? <section className="scene-plan-panel"><div className="section-heading"><div><p className="eyebrow">Scene Planning</p><h2>Exact narration and visual direction</h2><p>Each narration segment reconstructs the original synopsis exactly.</p></div></div><div className="scene-table" role="table" aria-label="Scene plan"><div className="scene-table-row scene-table-head" role="row"><span>Scene</span><span>Narration</span><span>Emotion</span><span>Visual direction</span><span>Duration</span><span>Status</span></div>{scenes.map((scene) => <div className="scene-table-row" role="row" key={scene.id}><span>{String(scene.sceneNumber).padStart(2, "0")}</span><span>{scene.exactText}</span><span>{scene.emotion}</span><span>{scene.cameraIntent}</span><span>{scene.estimatedDurationSeconds}s</span><span>{scene.approvedVersionId ? "Approved" : status === "BIBLE_READY" ? "Review required" : "Planned"}</span></div>)}</div></section> : <EmptyDiscovery title="Scene planning is waiting for the Production Bible." />;
  return <section id="story" className="planning"><BeginnerHint>This stage turns your synopsis into a production-ready plan.</BeginnerHint>{summary}<SubStageTabs label="Story stages" initialStage="bible" stages={[{ id: "input", label: "Story Input", status: "Complete", content: source }, { id: "bible", label: "Production Bible", status: storyStatus, content: bible }, { id: "characters", label: "Characters", status: productionBible ? storyStatus : "Waiting", content: characters }, { id: "environments", label: "Environments", status: productionBible ? storyStatus : "Waiting", content: environments }, { id: "scenes", label: "Scene Plan", status: productionBible ? storyStatus : "Waiting", content: plan }]} /></section>;
}

function BibleField({ label, value, source }: { label: string; value: string; source: "FROM_SYNOPSIS" | "AI_INFERRED" }) { return <div><span className="field-label">{label}</span><p>{value}</p><small>{sourceLabel(source)}</small></div>; }
function DiscoveryList({ eyebrow, title, items }: { eyebrow: string; title: string; items: Array<{ title: string; detail: string }> }) { return <section className="discovery-panel"><p className="eyebrow">{eyebrow}</p><h2>{title}</h2><div className="compact-rows">{items.map((item) => <article className="compact-row" key={item.title}><strong>{item.title}</strong><span>{item.detail}</span></article>)}</div></section>; }
function EmptyDiscovery({ title }: { title: string }) { return <section className="story-empty"><p>{title}</p></section>; }
