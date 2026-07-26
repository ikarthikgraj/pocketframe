import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { repositories } from "@/lib/db";
import { analyzeProjectSchema } from "@/lib/domain/contracts";
import { getStoryPlanner, MockStoryPlanner } from "@/lib/planning/planner";
import { segmentSynopsis } from "@/lib/synopsis/segment";
import { SynopsisReconstructionError, validateSynopsisReconstruction } from "@/lib/synopsis/validate";
import { isNovaProject, NOVA_SCRIPT_DELAY_MS, NOVA_PRODUCTION_BIBLE, NOVA_VOICE_BIBLE, NOVA_SCENES } from "@/lib/nova";

export const runtime = "nodejs";
type Context = { params: Promise<{ projectId: string }> };

export async function POST(request: Request, { params }: Context) {
  const input = analyzeProjectSchema.safeParse(await request.json().catch(() => ({})));
  if (!input.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "maxScenes must be between 1 and 6.", details: input.error.flatten() } }, { status: 400 });
  const projectId = (await params).projectId;
  const project = repositories().getProject(projectId);
  if (!project) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
  try {
    if (isNovaProject(project.title, project.synopsis)) {
      await new Promise((resolve) => setTimeout(resolve, NOVA_SCRIPT_DELAY_MS));
      const updated = repositories().replacePlanning(projectId, NOVA_PRODUCTION_BIBLE, NOVA_VOICE_BIBLE, NOVA_SCENES);
      return NextResponse.json({ projectId, status: updated?.status, productionBible: NOVA_PRODUCTION_BIBLE, voiceBible: NOVA_VOICE_BIBLE, scenes: repositories().listScenes(projectId) });
    }
    const segments = segmentSynopsis(project.synopsis, input.data.maxScenes);
    validateSynopsisReconstruction(project.synopsis, segments);
    let plan;
    try {
      plan = await getStoryPlanner().plan(project, segments);
    } catch (plannerErr) {
      console.warn("Primary story planner failed, executing deterministic fallback:", plannerErr);
      plan = await new MockStoryPlanner().plan(project, segments);
    }
    validateSynopsisReconstruction(project.synopsis, plan.scenes.map((scene: { exactText: string }) => scene.exactText));
    const updated = repositories().replacePlanning(projectId, plan.productionBible, plan.voiceBible, plan.scenes);
    return NextResponse.json({ projectId, status: updated?.status, productionBible: plan.productionBible, voiceBible: plan.voiceBible, scenes: repositories().listScenes(projectId) });
  } catch (error) {
    const reconstruction = error instanceof SynopsisReconstructionError;
    const zodValidation = error instanceof ZodError;
    const message = reconstruction ? error.message : zodValidation ? "The synopsis could not be processed into a valid production plan. Try shortening or simplifying the synopsis." : error instanceof Error ? error.message : "Could not analyze this project.";
    const code = reconstruction ? error.code : zodValidation ? "VALIDATION_ERROR" : "PLANNING_ERROR";
    return NextResponse.json({ error: { code, message } }, { status: 422 });
  }
}
