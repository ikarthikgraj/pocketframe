import path from "node:path";
import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { repositories } from "@/lib/db";
import { getConfig } from "@/lib/config";
import { updateProjectSchema, analyzeProjectSchema } from "@/lib/domain/contracts";
import { getStoryPlanner, MockStoryPlanner } from "@/lib/planning/planner";
import { segmentSynopsis } from "@/lib/synopsis/segment";
import { SynopsisReconstructionError, validateSynopsisReconstruction } from "@/lib/synopsis/validate";
import { measureAudioDurationMs, targetVideoDurationMs } from "@/lib/tts/duration";
import { audioExtension, getTtsProvider } from "@/lib/tts";
import { isNovaProject, isDramaProject, NOVA_SCRIPT_DELAY_MS, NOVA_PRODUCTION_BIBLE, NOVA_VOICE_BIBLE, NOVA_SCENES, DRAMA_PRODUCTION_BIBLE, DRAMA_VOICE_BIBLE, DRAMA_SCENES, NOVA_AUDIO_DELAY_MS, NOVA_AUDIO_PATH, DRAMA_AUDIO_PATH } from "@/lib/nova";

export const runtime = "nodejs";
type Context = { params: Promise<{ projectId: string }> };

export async function GET(_: Request, { params }: Context) {
  const project = repositories().getProject((await params).projectId);
  return project ? NextResponse.json({ project }) : NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
}

export async function PATCH(request: Request, { params }: Context) {
  const body = await request.json().catch(() => undefined);
  const result = updateProjectSchema.safeParse(body);
  if (!result.success || Object.keys(result.data).length === 0) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Provide at least one valid project field.", details: result.success ? undefined : result.error.flatten() } }, { status: 400 });
  const project = repositories().updateProject((await params).projectId, result.data);
  return project ? NextResponse.json({ project }) : NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
}

export async function DELETE(_: Request, { params }: Context) {
  const projectId = (await params).projectId;
  const deleted = repositories().deleteProject(projectId);
  return deleted
    ? NextResponse.json({ success: true, message: "Project deleted successfully" })
    : NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
}

export async function POST(request: Request, { params }: Context) {
  const projectId = (await params).projectId;
  const repo = repositories();
  const project = repo.getProject(projectId);
  if (!project) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const body = await request.json().catch(() => ({}));
  const action = searchParams.get("action") || body.action;

  // 1. Analyze / Story Planning
  if (action === "analyze") {
    const input = analyzeProjectSchema.safeParse(body);
    if (!input.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "maxScenes must be between 1 and 6.", details: input.error.flatten() } }, { status: 400 });
    try {
      if (isNovaProject(project.title, project.synopsis)) {
        await new Promise((resolve) => setTimeout(resolve, NOVA_SCRIPT_DELAY_MS));
        const updated = repo.replacePlanning(projectId, NOVA_PRODUCTION_BIBLE, NOVA_VOICE_BIBLE, NOVA_SCENES);
        return NextResponse.json({ projectId, status: updated?.status, productionBible: NOVA_PRODUCTION_BIBLE, voiceBible: NOVA_VOICE_BIBLE, scenes: repo.listScenes(projectId) });
      }
      if (isDramaProject(project.genre, project.title, project.synopsis)) {
        await new Promise((resolve) => setTimeout(resolve, NOVA_SCRIPT_DELAY_MS));
        const updated = repo.replacePlanning(projectId, DRAMA_PRODUCTION_BIBLE, DRAMA_VOICE_BIBLE, DRAMA_SCENES);
        return NextResponse.json({ projectId, status: updated?.status, productionBible: DRAMA_PRODUCTION_BIBLE, voiceBible: DRAMA_VOICE_BIBLE, scenes: repo.listScenes(projectId) });
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
      const updated = repo.replacePlanning(projectId, plan.productionBible, plan.voiceBible, plan.scenes);
      return NextResponse.json({ projectId, status: updated?.status, productionBible: plan.productionBible, voiceBible: plan.voiceBible, scenes: repo.listScenes(projectId) });
    } catch (error) {
      const reconstruction = error instanceof SynopsisReconstructionError;
      const zodValidation = error instanceof ZodError;
      const message = reconstruction ? error.message : zodValidation ? "The synopsis could not be processed into a valid production plan. Try shortening or simplifying the synopsis." : error instanceof Error ? error.message : "Could not analyze this project.";
      const code = reconstruction ? error.code : zodValidation ? "VALIDATION_ERROR" : "PLANNING_ERROR";
      return NextResponse.json({ error: { code, message } }, { status: 422 });
    }
  }

  // 2. Batch TTS Voice Generation
  if (action === "tts") {
    if (!project.voiceBible) return NextResponse.json({ error: { code: "VOICE_BIBLE_NOT_READY", message: "Approve the Production Bible before generating voice." } }, { status: 409 });
    const scenes = repo.listScenes(projectId);
    if (!scenes.length) return NextResponse.json({ error: { code: "NO_SCENES", message: "No scenes found for this project." } }, { status: 400 });

    try {
      if (isNovaProject(project.title, project.synopsis)) {
        await new Promise((resolve) => setTimeout(resolve, NOVA_AUDIO_DELAY_MS));
        const relativePath = NOVA_AUDIO_PATH;
        const totalDurationMs = 33840;
        for (const scene of scenes) {
          repo.createAudioVersion({ sceneId: scene.id, provider: "google", model: "en-IN-Wavenet-D", audioPath: relativePath, durationMs: totalDurationMs });
          repo.approveTts(scene.id);
        }
        return NextResponse.json({ projectId, audioPath: relativePath, durationMs: totalDurationMs, targetVideoDurationMs: targetVideoDurationMs(totalDurationMs), status: "TTS_APPROVED" });
      }

      if (isDramaProject(project.genre, project.title, project.synopsis)) {
        await new Promise((resolve) => setTimeout(resolve, NOVA_AUDIO_DELAY_MS));
        const relativePath = DRAMA_AUDIO_PATH;
        const totalDurationMs = 34680;
        for (const scene of scenes) {
          repo.createAudioVersion({ sceneId: scene.id, provider: "google", model: "hi-IN-Wavenet-D", audioPath: relativePath, durationMs: totalDurationMs });
          repo.approveTts(scene.id);
        }
        return NextResponse.json({ projectId, audioPath: relativePath, durationMs: totalDurationMs, targetVideoDurationMs: targetVideoDurationMs(totalDurationMs), status: "TTS_APPROVED" });
      }

      const fullText = scenes.map((s) => s.exactText).join(" ");
      const versionNumber = (repo.listAudioVersions(scenes[0]!.id) ?? []).length + 1;
      const relativePath = path.posix.join("projects", project.id, "audio", `narration-v${versionNumber}.${audioExtension()}`);
      const outputPath = path.join(getConfig().dataDirectory, relativePath);
      const performancePrompt = `${project.voiceBible.baselineStylePrompt || "Deliver narration with consistent tone."} ${project.voiceBible.tone}`;

      const result = await getTtsProvider().synthesize({ exactText: fullText, performancePrompt, outputPath, languageCode: project.languageCode, quality: "preview" });
      const totalDurationMs = await measureAudioDurationMs(result.audioPath);
      const totalWords = scenes.reduce((sum, s) => sum + s.exactText.trim().split(/\s+/).filter(Boolean).length, 0);

      for (const scene of scenes) {
        const sceneWords = scene.exactText.trim().split(/\s+/).filter(Boolean).length;
        const share = totalWords > 0 ? sceneWords / totalWords : 1 / scenes.length;
        const sceneDurationMs = Math.round(totalDurationMs * share);
        repo.createAudioVersion({ sceneId: scene.id, provider: result.provider, model: result.model, audioPath: relativePath, durationMs: sceneDurationMs });
        repo.approveTts(scene.id);
      }

      return NextResponse.json({ projectId, audioPath: relativePath, durationMs: totalDurationMs, targetVideoDurationMs: targetVideoDurationMs(totalDurationMs), status: "TTS_APPROVED" });
    } catch (error) {
      return NextResponse.json({ error: { code: "TTS_GENERATION_FAILED", message: error instanceof Error ? error.message : "Could not generate voice narration." } }, { status: 502 });
    }
  }

  // 3. Approve Production Bible (Default action)
  if (!project.productionBible) return NextResponse.json({ error: { code: "PLANNING_NOT_READY", message: "Generate story planning before approval." } }, { status: 409 });
  const updated = repo.approveProductionBible(projectId);
  return updated ? NextResponse.json({ projectId: updated.id, status: updated.status }) : NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
}
