"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductionBible } from "@/lib/domain/contracts";
import type { Scene } from "@/lib/db/repositories";

type Props = { projectId: string; productionBible: ProductionBible | null; scenes: Scene[]; status: string };
const label = (groundedness: "FROM_SYNOPSIS" | "AI_INFERRED") => groundedness === "FROM_SYNOPSIS" ? "From synopsis" : "AI inferred";

export function StoryPlanningSetup({ projectId, productionBible, scenes, status }: Props) {
  const router = useRouter();
  const [working, setWorking] = useState(false); const [error, setError] = useState<string>();
  async function action(path: string) {
    setWorking(true); setError(undefined);
    const response = await fetch(`/api/projects/${projectId}/${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: path === "analyze" ? JSON.stringify({ maxScenes: 6 }) : undefined });
    const data = await response.json(); setWorking(false);
    if (!response.ok) return setError(data.error?.message ?? "Could not complete this action.");
    router.refresh();
  }
  if (!productionBible) return <section className="story-empty"><p className="eyebrow">Production planning</p><h2>Build the production bible</h2><p>Generate the story direction and exact narration scenes from the approved source synopsis.</p>{error && <p className="error" role="alert">{error}</p>}<button onClick={() => action("analyze")} disabled={working}>{working ? "Generating…" : "Generate Production Bible"}</button></section>;
  const fields = ["premise", "hook", "conflict", "tone", "mood", "visualStyle"] as const;
  return <section className="planning"><div className="section-heading"><div><p className="eyebrow">Production planning</p><h2>Production Bible</h2><p>Review source-grounded direction before moving to narration.</p></div>{status === "BIBLE_READY" && <button onClick={() => action("approve-bible")} disabled={working}>{working ? "Approving…" : "Approve Production Bible"}</button>}</div>{error && <p className="error" role="alert">{error}</p>}<article className="bible-summary"><div><span className="field-label">Premise</span><p>{productionBible.premise.text}</p></div><div><span className="field-label">Hook</span><p>{productionBible.hook.text}</p></div><div className="bible-chips"><span>{productionBible.tone.text}</span><span>{productionBible.mood.text}</span>{productionBible.themes.map((theme) => <span key={theme.text}>{theme.text}</span>)}</div><div className="bible-details">{fields.slice(2).map((field) => <div key={field}><span className="field-label">{field === "visualStyle" ? "Visual style" : field}</span><p>{productionBible[field].text}</p><small>{label(productionBible[field].groundedness)}</small></div>)}</div></article><h3 className="group-title">Characters</h3><div className="card-grid">{productionBible.characters.map((character) => <article className="card compact-card" key={character.name}><span className="field-label">{label(character.description.groundedness)}</span><h4>{character.name}</h4><p>{character.description.text}</p></article>)}</div><h3 className="group-title">Environments</h3><div className="card-grid">{productionBible.environments.map((environment) => <article className="card compact-card" key={environment.name}><span className="field-label">{label(environment.description.groundedness)}</span><h4>{environment.name}</h4><p>{environment.description.text}</p></article>)}</div><div className="section-heading scene-plan-heading"><div><h3>Scene plan</h3><p>{productionBible.trailerDurationSeconds}s target runtime</p></div></div><div className="scene-list">{scenes.map((scene) => <article className="card scene-plan-card" key={scene.id}><span className="scene-number">{String(scene.sceneNumber).padStart(2, "0")}</span><div><p className="scene-text">{scene.exactText}</p><div className="detail-row"><span><b>Emotion</b>{scene.emotion}</span><span><b>Camera</b>{scene.cameraIntent}</span><span><b>Estimate</b>{scene.estimatedDurationSeconds}s</span></div></div></article>)}</div></section>;
}
