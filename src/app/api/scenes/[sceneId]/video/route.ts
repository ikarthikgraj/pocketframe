import path from "node:path";
import { NextResponse } from "next/server";
import { repositories } from "@/lib/db";
import { generateVideoSchema } from "@/lib/domain/contracts";
import { getConfig } from "@/lib/config";
import { getVideoProvider } from "@/lib/video";

export const runtime = "nodejs";
type Context = { params: Promise<{ sceneId: string }> };
const negativePrompt = "No subtitles, captions, logos, watermarks, on-screen text, lip sync, face morphing, identity drift, costume changes, duplicate people, extra limbs, malformed hands, flicker, frame warping, abrupt camera jumps, excessive motion blur, plastic skin, game-engine look, graphic violence, or unsafe content.";

export async function POST(request: Request, { params }: Context) {
  const input = generateVideoSchema.safeParse(await request.json().catch(() => ({})));
  if (!input.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Provide a valid video prompt.", details: input.error.flatten() } }, { status: 400 });
  const repo = repositories(); const scene = repo.getScene((await params).sceneId);
  if (!scene) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Scene not found." } }, { status: 404 });
  if (scene.status !== "TTS_APPROVED" && scene.status !== "VIDEO_QUEUED" && scene.status !== "VIDEO_GENERATING" && scene.status !== "VIDEO_REVIEW" && scene.status !== "APPROVED") return NextResponse.json({ error: { code: "TTS_NOT_APPROVED", message: "Approve this scene's narration before generating a shot." } }, { status: 409 });
  if (repo.countProviderVersions(scene.id) >= 2) return NextResponse.json({ error: { code: "VERSION_LIMIT", message: "This scene already has the maximum two provider-generated versions. Upload a replacement MP4 if needed." } }, { status: 409 });
  const project = repo.getProject(scene.projectId);
  const visualPrompt = input.data.prompt ?? scene.promptNotes ?? "Cinematic vertical trailer shot consistent with the approved production bible.";
  const versionNumber = repo.listSceneVersions(scene.id).length + 1;
  const relativePath = path.posix.join("projects", scene.projectId, "videos", `scene-${String(scene.sceneNumber).padStart(2, "0")}-v${versionNumber}-original.mp4`);
  const version = repo.createSceneVersion({ sceneId: scene.id, provider: input.data.provider, prompt: visualPrompt, negativePrompt, providerJobId: undefined });
  try {
    const job = await getVideoProvider(input.data.provider).submit({ sceneId: scene.id, versionNumber: version.versionNumber, prompt: visualPrompt, negativePrompt, targetDurationMs: scene.targetVideoDurationMs ?? 1_200, outputPath: path.join(getConfig().dataDirectory, relativePath) });
    const databaseVersion = repo.updateSceneVersion(version.id, { providerJobId: job.providerJobId ?? null })!;
    return NextResponse.json({ version: databaseVersion, scenePrompt: { sceneNumber: scene.sceneNumber, exactNarrationText: scene.exactText, visualPrompt, negativePrompt, cameraDirection: scene.cameraIntent, environment: project?.productionBible?.environments ?? [], characterReferences: project?.productionBible?.characters ?? [], mood: scene.mood, emotion: scene.emotion, targetDurationMs: scene.targetVideoDurationMs, providerStatus: "QUEUED" } }, { status: 201 });
  } catch (error) {
    repo.updateSceneVersion(version.id, { status: "FAILED", errorMessage: error instanceof Error ? error.message : "Video generation failed." });
    return NextResponse.json({ error: { code: "VIDEO_GENERATION_FAILED", message: error instanceof Error ? error.message : "Could not generate video." }, versionId: version.id }, { status: 502 });
  }
}
