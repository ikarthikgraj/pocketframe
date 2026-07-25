"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductionBible } from "@/lib/domain/contracts";
import type { Scene } from "@/lib/db/repositories";

type Props = { projectId: string; productionBible: ProductionBible | null; scenes: Scene[]; status: string };

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
  return <section id="story" className="planning"><div className="section-heading"><div><p className="eyebrow">Production planning</p><h2>Production Bible</h2></div>{status === "BIBLE_READY" && <button onClick={() => action("approve-bible")} disabled={working}>{working ? "Approving…" : "Approve Production Bible"}</button>}</div>{error && <p className="error" role="alert">{error}</p>}<article className="bible-summary"><div><span className="field-label">Premise</span><p>{productionBible.premise.text}</p></div><div><span className="field-label">Hook</span><p>{productionBible.hook.text}</p></div><div><span className="field-label">Conflict</span><p>{productionBible.conflict.text}</p></div></article><div className="metadata-row"><span>{productionBible.tone.text}</span><span>{productionBible.mood.text}</span><span>{productionBible.trailerDurationSeconds}s trailer</span><span>{scenes.length} scenes</span></div><div className="story-columns"><div><h3 className="group-title">Characters</h3><div className="compact-rows">{productionBible.characters.map((character) => <article className="compact-row" key={character.name}><strong>{character.name}</strong><span>{character.description.text}</span></article>)}</div></div><div><h3 className="group-title">Environments</h3><div className="compact-rows">{productionBible.environments.map((environment) => <article className="compact-row" key={environment.name}><strong>{environment.name}</strong><span>{environment.description.text}</span></article>)}</div></div></div><div className="scene-plan-heading"><h3>Scene plan</h3></div><div className="scene-table" role="table" aria-label="Scene plan"><div className="scene-table-row scene-table-head" role="row"><span>Scene</span><span>Narration</span><span>Emotion</span><span>Camera</span><span>Duration</span><span>Status</span></div>{scenes.map((scene) => <div className="scene-table-row" role="row" key={scene.id}><span>{String(scene.sceneNumber).padStart(2, "0")}</span><span>{scene.exactText}</span><span>{scene.emotion}</span><span>{scene.cameraIntent}</span><span>{scene.estimatedDurationSeconds}s</span><span>{scene.approvedVersionId ? "Approved" : "Planned"}</span></div>)}</div></section>;
}
