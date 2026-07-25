import { plannedSceneSchema, productionBibleSchema, type PlannedScene, type ProductionBible } from "@/lib/domain/contracts";
import type { Project } from "@/lib/db/repositories";
import { validateSynopsisReconstruction } from "@/lib/synopsis/validate";

export type PlanningResult = { productionBible: ProductionBible; scenes: PlannedScene[] };
export interface StoryPlanner {
  plan(project: Project, exactSegments: string[]): Promise<PlanningResult>;
}

export class MockStoryPlanner implements StoryPlanner {
  async plan(project: Project, exactSegments: string[]): Promise<PlanningResult> {
    validateSynopsisReconstruction(project.synopsis, exactSegments);
    const protagonist = project.synopsis.match(/\b[A-Z][a-z]+\b/)?.[0] ?? "The protagonist";
    const bible = productionBibleSchema.parse({
      premise: { text: project.synopsis, groundedness: "FROM_SYNOPSIS" },
      hook: { text: `A cinematic entry into ${project.title}.`, groundedness: "AI_INFERRED" },
      conflict: { text: "The central choice and its consequences described in the synopsis.", groundedness: "FROM_SYNOPSIS" },
      tone: { text: `${project.genre} with restrained cinematic tension.`, groundedness: "AI_INFERRED" },
      mood: { text: "Tense, intimate, and anticipatory.", groundedness: "AI_INFERRED" },
      visualStyle: { text: "Grounded cinematic realism, controlled contrast, and deliberate framing.", groundedness: "AI_INFERRED" },
      characters: [{ name: protagonist, description: { text: "Primary figure referenced in the official synopsis.", groundedness: "FROM_SYNOPSIS" } }],
      environments: [{ name: "Primary story setting", description: { text: "A setting inferred only from the official synopsis.", groundedness: "AI_INFERRED" } }],
      themes: [{ text: "Choice under pressure.", groundedness: "AI_INFERRED" }],
      trailerDurationSeconds: Math.max(25, exactSegments.length * 8),
      sceneCount: exactSegments.length,
    });
    const scenes = exactSegments.map((exactText, index) => plannedSceneSchema.parse({
      sceneNumber: index + 1,
      exactText,
      emotion: index === exactSegments.length - 1 ? "Urgency" : "Controlled tension",
      mood: "Suspenseful",
      cameraIntent: index === 0 ? "Slow establishing push-in" : "Measured forward movement toward the choice",
      estimatedDurationSeconds: Math.max(4, Math.ceil(exactText.trim().split(/\s+/).length / 2.5)),
      promptNotes: "Use the approved visual style and keep the action focused on one readable story beat.",
    }));
    return { productionBible: bible, scenes };
  }
}

export const storyPlanner: StoryPlanner = new MockStoryPlanner();
