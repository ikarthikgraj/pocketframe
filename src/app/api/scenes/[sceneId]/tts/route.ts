import path from "node:path";
import { NextResponse } from "next/server";
import { repositories } from "@/lib/db";
import { generateTtsSchema } from "@/lib/domain/contracts";
import { validateSynopsisReconstruction, SynopsisReconstructionError } from "@/lib/synopsis/validate";
import { getConfig } from "@/lib/config";
import { measureAudioDurationMs, targetVideoDurationMs } from "@/lib/tts/duration";
import { getTtsProvider } from "@/lib/tts";
import { buildPerformancePrompt } from "@/lib/tts/performance-prompt";

export const runtime = "nodejs";
type Context = { params: Promise<{ sceneId: string }> };

export async function POST(request: Request, { params }: Context) {
  const input = generateTtsSchema.safeParse(await request.json().catch(() => ({})));
  if (!input.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Provide a valid delivery prompt and quality.", details: input.error.flatten() } }, { status: 400 });
  const sceneId = (await params).sceneId; const repo = repositories(); const scene = repo.getScene(sceneId);
  if (!scene) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Scene not found." } }, { status: 404 });
  const project = repo.getProject(scene.projectId);
  if (!project?.voiceBible) return NextResponse.json({ error: { code: "VOICE_BIBLE_NOT_READY", message: "Approve the Production Bible before generating voice." } }, { status: 409 });
  try {
    validateSynopsisReconstruction(project.synopsis, repo.listScenes(project.id).map((item) => item.exactText));
    const directedScene = input.data.deliveryPrompt ? repo.updateSceneDeliveryPrompt(sceneId, input.data.deliveryPrompt)! : scene;
    const versionNumber = repo.listAudioVersions(sceneId).length + 1;
    const relativePath = path.posix.join("projects", project.id, "audio", `scene-${String(scene.sceneNumber).padStart(2, "0")}-v${versionNumber}.wav`);
    const outputPath = path.join(getConfig().dataDirectory, relativePath);
    const result = await getTtsProvider().synthesize({ exactText: directedScene.exactText, performancePrompt: buildPerformancePrompt(project.voiceBible, directedScene), outputPath, languageCode: project.languageCode, quality: input.data.quality });
    const durationMs = await measureAudioDurationMs(result.audioPath);
    const audioVersion = repo.createAudioVersion({ sceneId, provider: result.provider, model: result.model, audioPath: relativePath, durationMs });
    return NextResponse.json({ sceneId, audioVersion, ttsPath: relativePath, ttsDurationMs: durationMs, targetVideoDurationMs: targetVideoDurationMs(durationMs), status: "TTS_READY" });
  } catch (error) {
    const reconstruction = error instanceof SynopsisReconstructionError;
    return NextResponse.json({ error: { code: reconstruction ? error.code : "TTS_GENERATION_FAILED", message: error instanceof Error ? error.message : "Could not generate audio." } }, { status: reconstruction ? 422 : 502 });
  }
}
