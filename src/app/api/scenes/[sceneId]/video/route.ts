import path from "node:path";
import { NextResponse } from "next/server";
import { repositories } from "@/lib/db";
import { generateVideoSchema } from "@/lib/domain/contracts";
import { getConfig } from "@/lib/config";
import { getVideoProvider } from "@/lib/video";
import { assertSilentVisualPrompt, defaultSilentVisualPrompt, silentVideoNegativePrompt } from "@/lib/video/prompt";

export const runtime = "nodejs";
type Context = { params: Promise<{ sceneId: string }> };

export async function POST(request: Request, { params }: Context) {
  const input = generateVideoSchema.safeParse(await request.json().catch(() => ({})));
  if (!input.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Provide a valid video prompt.", details: input.error.flatten() } }, { status: 400 });
  const repo = repositories(); const scene = repo.getScene((await params).sceneId);
  if (!scene) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Scene not found." } }, { status: 404 });
  if (!projectAllowsShots(repo.getProject(scene.projectId)?.status)) return NextResponse.json({ error: { code: "BIBLE_NOT_APPROVED", message: "Approve the Production Bible before generating silent shots." } }, { status: 409 });
  if (repo.countProviderVersions(scene.id) >= 2) return NextResponse.json({ error: { code: "VERSION_LIMIT", message: "This scene already has the maximum two provider-generated versions. Upload a replacement MP4 if needed." } }, { status: 409 });
  const project = repo.getProject(scene.projectId);
  let visualPrompt: string;
  try { visualPrompt = input.data.prompt ? assertSilentVisualPrompt(input.data.prompt) : defaultSilentVisualPrompt(scene.promptNotes); }
  catch (error) { return NextResponse.json({ error: { code: "AUDIO_IN_VISUAL_PROMPT", message: error instanceof Error ? error.message : "Visual prompt contains audio direction." } }, { status: 422 }); }
  const versionNumber = repo.listSceneVersions(scene.id).length + 1;
  const relativePath = path.posix.join("projects", scene.projectId, "videos", `scene-${String(scene.sceneNumber).padStart(2, "0")}-v${versionNumber}-original.mp4`);
  const version = repo.createSceneVersion({ sceneId: scene.id, provider: input.data.provider, prompt: visualPrompt, negativePrompt: silentVideoNegativePrompt, providerJobId: undefined });
  try {
    const job = await getVideoProvider(input.data.provider).submit({ sceneId: scene.id, versionNumber: version.versionNumber, prompt: visualPrompt, negativePrompt: silentVideoNegativePrompt, targetDurationMs: scene.targetVideoDurationMs ?? Math.max(2_000, (scene.estimatedDurationSeconds ?? 4) * 1_000), outputPath: path.join(getConfig().dataDirectory, relativePath) });
    const databaseVersion = repo.updateSceneVersion(version.id, { providerJobId: job.providerJobId ?? null })!;
    return NextResponse.json({ version: databaseVersion, sourceContext: { exactNarrationText: scene.exactText }, scenePrompt: { subject: project?.productionBible?.characters ?? [], action: scene.promptNotes, environment: project?.productionBible?.environments ?? [], lighting: project?.productionBible?.visualStyle.text, cameraMovement: scene.cameraIntent, visualMood: scene.mood, duration: scene.targetVideoDurationMs, aspectRatio: "9:16", visualPrompt, negativeVisualConstraints: silentVideoNegativePrompt, providerStatus: "QUEUED" } }, { status: 201 });
  } catch (error) {
    repo.updateSceneVersion(version.id, { status: "FAILED", errorMessage: error instanceof Error ? error.message : "Video generation failed." });
    return NextResponse.json({ error: { code: "VIDEO_GENERATION_FAILED", message: error instanceof Error ? error.message : "Could not generate video." }, versionId: version.id }, { status: 502 });
  }
}

function projectAllowsShots(status?: string) { return status === "SHOT_GENERATION" || status === "SHOT_REVIEW" || status === "VOICE_REVIEW" || status === "READY_TO_RENDER" || status === "COMPLETE"; }
