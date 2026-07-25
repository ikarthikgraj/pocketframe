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
  if (!productionBible) return <section><h2>Story planning</h2><p>Generate a structured Production Bible and exact narration scenes from the original synopsis.</p>{error && <p className="error" role="alert">{error}</p>}<button onClick={() => action("analyze")} disabled={working}>{working ? "Generating…" : "Generate Production Bible"}</button></section>;
  const fields = ["premise", "hook", "conflict", "tone", "mood", "visualStyle"] as const;
  return <section className="planning"><div className="section-heading"><div><h2>Production Bible</h2><p>Ready for review</p></div>{status === "BIBLE_READY" && <button onClick={() => action("approve-bible")} disabled={working}>{working ? "Approving…" : "Approve Production Bible"}</button>}</div>{error && <p className="error" role="alert">{error}</p>}<div className="bible-grid">{fields.map((field) => <article className="card" key={field}><h3>{field === "visualStyle" ? "Visual style" : field}</h3><p>{productionBible[field].text}</p><small>{label(productionBible[field].groundedness)}</small></article>)}</div><h3>Characters</h3><div className="card-grid">{productionBible.characters.map((character) => <article className="card" key={character.name}><h4>{character.name}</h4><p>{character.description.text}</p><small>{label(character.description.groundedness)}</small></article>)}</div><h3>Environments</h3><div className="card-grid">{productionBible.environments.map((environment) => <article className="card" key={environment.name}><h4>{environment.name}</h4><p>{environment.description.text}</p><small>{label(environment.description.groundedness)}</small></article>)}</div><h3>Scenes · {productionBible.trailerDurationSeconds}s target</h3><div className="scene-list">{scenes.map((scene) => <article className="card" key={scene.id}><h4>Scene {String(scene.sceneNumber).padStart(2, "0")}</h4><p className="scene-text">{scene.exactText}</p><p><b>Emotion:</b> {scene.emotion} · <b>Mood:</b> {scene.mood}</p><p><b>Camera:</b> {scene.cameraIntent} · <b>Estimate:</b> {scene.estimatedDurationSeconds}s</p><p><b>Prompt notes:</b> {scene.promptNotes}</p></article>)}</div></section>;
}
