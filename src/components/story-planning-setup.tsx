"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ProductionBible } from "@/lib/domain/contracts";
import type { Scene } from "@/lib/db/repositories";
import { ProjectReferences } from "@/components/project-references";
import type { ProjectReference } from "@/lib/db/repositories";

type Props = {
  projectId: string;
  project: { title: string; synopsis: string; genre: string; languageCode: string; references: ProjectReference[] };
  productionBible: ProductionBible | null;
  scenes: Scene[];
  status: string;
};

const sourceLabel = (value: "FROM_SYNOPSIS" | "AI_INFERRED") => (value === "FROM_SYNOPSIS" ? "From synopsis" : "AI inferred");

export function StoryPlanningSetup({ projectId, project, productionBible, scenes, status }: Props) {
  const router = useRouter();
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string>();
  const [isEditingSynopsis, setIsEditingSynopsis] = useState(false);
  const [synopsisText, setSynopsisText] = useState(project.synopsis);
  const [savingSynopsis, setSavingSynopsis] = useState(false);

  async function action(path: string) {
    setWorking(true);
    setError(undefined);
    const response = await fetch(`/api/projects/${projectId}/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: path === "analyze" ? JSON.stringify({ maxScenes: 4 }) : undefined,
    });
    const data = await response.json();
    setWorking(false);
    if (!response.ok) return setError(data.error?.message ?? "Could not complete this action.");
    router.refresh();
  }

  async function saveSynopsis() {
    if (!synopsisText.trim()) return setError("Synopsis cannot be empty.");
    setSavingSynopsis(true);
    setError(undefined);
    const response = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ synopsis: synopsisText }),
    });
    const data = await response.json();
    setSavingSynopsis(false);
    if (!response.ok) return setError(data.error?.message ?? "Could not save synopsis.");
    setIsEditingSynopsis(false);
    router.refresh();
  }

  return (
    <section id="story" className="planning">
      {error && <p className="error" role="alert" style={{ marginBottom: 16 }}>{error}</p>}

      {/* Source Synopsis Card */}
      <section className="story-input-panel">
        <div className="section-heading">
          <div>
            <h2>Original Source Synopsis</h2>
          </div>
          <div className="actions">
            {!isEditingSynopsis && (
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setSynopsisText(project.synopsis);
                  setIsEditingSynopsis(true);
                }}
                disabled={working || savingSynopsis}
              >
                Edit Synopsis
              </button>
            )}
            {!productionBible && !isEditingSynopsis && (
              <button onClick={() => action("analyze")} disabled={working || status === "ANALYZING"}>
                {working || status === "ANALYZING" ? "Analyzing synopsis…" : "Generate Production Bible"}
              </button>
            )}
            {productionBible && !isEditingSynopsis && (
              <button onClick={() => action("analyze")} disabled={working || status === "ANALYZING"} className="button secondary">
                {working || status === "ANALYZING" ? "Re-analyzing…" : "Re-generate Bible"}
              </button>
            )}
          </div>
        </div>

        {isEditingSynopsis ? (
          <div className="synopsis-edit-box">
            <textarea
              className="synopsis-edit-textarea"
              value={synopsisText}
              onChange={(e) => setSynopsisText(e.target.value)}
              rows={5}
              placeholder="Enter audio series or trailer synopsis..."
            />
            <div className="synopsis-edit-actions">
              <button type="button" className="button primary" onClick={saveSynopsis} disabled={savingSynopsis}>
                {savingSynopsis ? "Saving…" : "Save Synopsis"}
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={() => {
                  setSynopsisText(project.synopsis);
                  setIsEditingSynopsis(false);
                }}
                disabled={savingSynopsis}
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="synopsis">{project.synopsis}</p>
        )}
      </section>

      <ProjectReferences projectId={projectId} references={project.references} />

      {/* Generated Production Bible */}
      {productionBible && (
        <>
          <section className="planning-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Production Bible</p>
                <h2>Creative Direction</h2>
              </div>
              {status === "BIBLE_READY" && (
                <button onClick={() => action("approve-bible")} disabled={working}>
                  {working ? "Approving…" : "Approve Production Bible"}
                </button>
              )}
            </div>

            <article className="bible-summary">
              <BibleField label="Premise" value={productionBible.premise.text} source={productionBible.premise.groundedness} />
              <BibleField label="Hook" value={productionBible.hook.text} source={productionBible.hook.groundedness} />
              <BibleField label="Conflict" value={productionBible.conflict.text} source={productionBible.conflict.groundedness} />
            </article>

            <div className="metadata-row">
              <span>Tone: {productionBible.tone.text}</span>
              <span>Mood: {productionBible.mood.text}</span>
              {productionBible.themes.map((theme) => (
                <span key={theme.text}>Theme: {theme.text}</span>
              ))}
            </div>

            {status === "BIBLE_READY" && (
              <p className="review-callout">Review required: approve this plan to unlock Voice and Shots.</p>
            )}
          </section>

          {/* Scene Breakdown Table */}
          <section className="scene-plan-panel">
            <div className="section-heading">
              <div>
                <p className="eyebrow">Scene Planning</p>
                <h2>Narration Scenes ({scenes.length} beats)</h2>
              </div>
            </div>
            <div className="scene-table" role="table" aria-label="Scene plan">
              <div className="scene-table-row scene-table-head" role="row">
                <span>Scene</span>
                <span>Narration</span>
                <span>Emotion</span>
                <span>Visual Direction</span>
                <span>Duration</span>
              </div>
              {scenes.map((scene) => (
                <div className="scene-table-row" role="row" key={scene.id}>
                  <span>{String(scene.sceneNumber).padStart(2, "0")}</span>
                  <span>{scene.exactText}</span>
                  <span>{scene.emotion}</span>
                  <span>{scene.cameraIntent}</span>
                  <span>{scene.estimatedDurationSeconds}s</span>
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </section>
  );
}

function BibleField({ label, value, source }: { label: string; value: string; source: "FROM_SYNOPSIS" | "AI_INFERRED" }) {
  return (
    <div>
      <span className="field-label">{label}</span>
      <p>{value}</p>
      <small>{sourceLabel(source)}</small>
    </div>
  );
}
