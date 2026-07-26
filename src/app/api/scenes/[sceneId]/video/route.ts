import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { repositories } from "@/lib/db";
import { generateVideoSchema } from "@/lib/domain/contracts";
import { getConfig } from "@/lib/config";
import { getVideoProvider } from "@/lib/video";
import { measureVideoDurationMs } from "@/lib/video/measure";
import { assertSilentVisualPrompt, composeVisualPromptWithReferences, defaultSilentVisualPrompt, silentVideoNegativePrompt, type SelectedVisualReference } from "@/lib/video/prompt";
import { automaticVideoDuration, normalizeVideoDuration, supportedVideoDurations } from "@/lib/video/duration";
import { isNovaProject, isDramaProject, NOVA_SCENE_DELAY_MS, NOVA_SCENE_1_VIDEO, NOVA_SCENE_2_VIDEO, DRAMA_SCENE_1_VIDEO, DRAMA_SCENE_2_VIDEO } from "@/lib/nova";

export const runtime = "nodejs";
type Context = { params: Promise<{ sceneId: string }> };
const MAX_UPLOAD_BYTES = 100 * 1024 * 1024;

export async function POST(request: Request, { params }: Context) {
  const repo = repositories(); const sceneId = (await params).sceneId; const scene = repo.getScene(sceneId);
  if (!scene) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Scene not found." } }, { status: 404 });
  if (!projectAllowsShots(repo.getProject(scene.projectId)?.status)) return NextResponse.json({ error: { code: "BIBLE_NOT_APPROVED", message: "Approve the Production Bible before creating silent shots." } }, { status: 409 });

  const multipart = request.headers.get("content-type")?.includes("multipart/form-data") ?? false;
  if (multipart) {
    const form = await request.formData().catch(() => undefined); const file = form?.get("file");
    if (!(file instanceof File) || file.size === 0 || file.size > MAX_UPLOAD_BYTES || (!file.type.includes("mp4") && !file.name.toLowerCase().endsWith(".mp4"))) return NextResponse.json({ error: { code: "INVALID_MEDIA", message: "Upload a non-empty MP4 no larger than 100 MB." } }, { status: 400 });
    const bytes = Buffer.from(await file.arrayBuffer());
    if (!bytes.subarray(4, 12).toString("ascii").includes("ftyp")) return NextResponse.json({ error: { code: "INVALID_MEDIA", message: "The uploaded file is not a valid MP4 container." } }, { status: 400 });
    const versionNumber = repo.listSceneVersions(scene.id).length + 1; const relativePath = path.posix.join("projects", scene.projectId, "videos", `scene-${String(scene.sceneNumber).padStart(2, "0")}-v${versionNumber}-original.mp4`); const output = path.join(getConfig().dataDirectory, relativePath);
    await fs.mkdir(path.dirname(output), { recursive: true }); await fs.writeFile(output, bytes);
    try { const durationMs = await measureVideoDurationMs(output); const submittedPrompt = form?.get("prompt"); const prompt = typeof submittedPrompt === "string" && submittedPrompt.trim() ? assertSilentVisualPrompt(submittedPrompt) : defaultSilentVisualPrompt(scene.promptNotes); const version = repo.createSceneVersion({ sceneId: scene.id, provider: "manual", prompt, negativePrompt: silentVideoNegativePrompt, videoPath: relativePath, durationMs, status: "READY" }); return NextResponse.json({ version }, { status: 201 }); }
    catch (error) { await fs.unlink(output).catch(() => undefined); return NextResponse.json({ error: { code: "INVALID_MEDIA", message: error instanceof Error ? error.message : "Could not read the MP4." } }, { status: 400 }); }
  }

  const input = generateVideoSchema.safeParse(await request.json().catch(() => ({})));
  if (!input.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Provide a valid video prompt.", details: input.error.flatten() } }, { status: 400 });
  if (!repo.listAudioVersions(scene.id).some((audio) => audio.status === "APPROVED" && audio.scriptHash === scene.narrationScriptHash)) return NextResponse.json({ error: { code: "CURRENT_AUDIO_NOT_APPROVED", message: `Scene ${scene.sceneNumber} narration changed. Generate and approve a new audio version before creating a shot.` } }, { status: 409 });
  if (repo.countProviderVersions(scene.id) >= 2) return NextResponse.json({ error: { code: "VERSION_LIMIT", message: "This scene already has the maximum two provider-generated versions. Upload a replacement MP4 if needed." } }, { status: 409 });
  const project = repo.getProject(scene.projectId);
  if (!project) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
  const selectedReferences: SelectedVisualReference[] = project.references.filter((reference) => scene.selectedReferenceIds.includes(reference.id) && reference.active).map((reference) => ({ id: reference.id, name: reference.displayName, type: reference.type, path: reference.localPath, description: reference.description }));
  const requestedDuration = input.data.durationSeconds === null ? null : input.data.durationSeconds === undefined ? scene.videoDurationSeconds : normalizeVideoDuration(input.data.durationSeconds, supportedVideoDurations);
  if (input.data.durationSeconds !== undefined && input.data.durationSeconds !== null && requestedDuration !== input.data.durationSeconds) return NextResponse.json({ error: { code: "UNSUPPORTED_DURATION", message: `Choose one of: ${supportedVideoDurations.map((duration) => `${duration} sec`).join(", ")}.` } }, { status: 400 });
  const persistedScene = repo.setSceneVideoDuration(scene.id, requestedDuration) ?? scene;
  const sourceDurationSeconds = persistedScene.videoDurationSeconds ?? automaticVideoDuration(persistedScene.targetVideoDurationMs, supportedVideoDurations);
  let visualPrompt: string;
  try { visualPrompt = composeVisualPromptWithReferences(input.data.prompt ? assertSilentVisualPrompt(input.data.prompt) : defaultSilentVisualPrompt(scene.promptNotes), selectedReferences); }
  catch (error) { return NextResponse.json({ error: { code: "AUDIO_IN_VISUAL_PROMPT", message: error instanceof Error ? error.message : "Visual prompt contains audio direction." } }, { status: 422 }); }
  const versionNumber = repo.listSceneVersions(persistedScene.id).length + 1;
  let relativePath = path.posix.join("projects", persistedScene.projectId, "videos", `scene-${String(persistedScene.sceneNumber).padStart(2, "0")}-v${versionNumber}-original.mp4`);

  if (isNovaProject(project.title, project.synopsis)) {
    await new Promise((resolve) => setTimeout(resolve, NOVA_SCENE_DELAY_MS));
    relativePath = scene.sceneNumber === 1 ? NOVA_SCENE_1_VIDEO : NOVA_SCENE_2_VIDEO;
    const version = repo.createSceneVersion({ sceneId: scene.id, provider: input.data.provider, model: input.data.model, prompt: visualPrompt, negativePrompt: silentVideoNegativePrompt, providerJobId: `nova-mock-${Date.now()}` });
    const databaseVersion = repo.updateSceneVersion(version.id, { status: "APPROVED", videoPath: relativePath, durationMs: sourceDurationSeconds * 1000 })!;
    repo.approveSceneVersion(databaseVersion.id);
    return NextResponse.json({ version: databaseVersion, sourceContext: { exactNarrationText: persistedScene.exactText }, scenePrompt: { subject: project.productionBible?.characters ?? [], action: persistedScene.promptNotes, environment: project.productionBible?.environments ?? [], lighting: project.productionBible?.visualStyle.text, cameraMovement: persistedScene.cameraIntent, visualMood: persistedScene.mood, duration: sourceDurationSeconds * 1_000, aspectRatio: "9:16", visualPrompt, selectedReferences, negativeVisualConstraints: silentVideoNegativePrompt, providerStatus: "READY" } }, { status: 201 });
  }

  if (isDramaProject(project.genre, project.title, project.synopsis)) {
    await new Promise((resolve) => setTimeout(resolve, NOVA_SCENE_DELAY_MS));
    relativePath = scene.sceneNumber === 1 ? DRAMA_SCENE_1_VIDEO : DRAMA_SCENE_2_VIDEO;
    const version = repo.createSceneVersion({ sceneId: scene.id, provider: input.data.provider, model: input.data.model, prompt: visualPrompt, negativePrompt: silentVideoNegativePrompt, providerJobId: `drama-mock-${Date.now()}` });
    const databaseVersion = repo.updateSceneVersion(version.id, { status: "APPROVED", videoPath: relativePath, durationMs: sourceDurationSeconds * 1000 })!;
    repo.approveSceneVersion(databaseVersion.id);
    return NextResponse.json({ version: databaseVersion, sourceContext: { exactNarrationText: persistedScene.exactText }, scenePrompt: { subject: project.productionBible?.characters ?? [], action: persistedScene.promptNotes, environment: project.productionBible?.environments ?? [], lighting: project.productionBible?.visualStyle.text, cameraMovement: persistedScene.cameraIntent, visualMood: persistedScene.mood, duration: sourceDurationSeconds * 1_000, aspectRatio: "9:16", visualPrompt, selectedReferences, negativeVisualConstraints: silentVideoNegativePrompt, providerStatus: "READY" } }, { status: 201 });
  }

  const version = repo.createSceneVersion({ sceneId: scene.id, provider: input.data.provider, model: input.data.model, prompt: visualPrompt, negativePrompt: silentVideoNegativePrompt, providerJobId: undefined });
  try {
    const providerPayload = { sceneId: persistedScene.id, versionNumber: version.versionNumber, prompt: visualPrompt, negativePrompt: silentVideoNegativePrompt, targetDurationMs: sourceDurationSeconds * 1_000, outputPath: path.join(getConfig().dataDirectory, relativePath), selectedReferences };
    const job = await getVideoProvider(input.data.provider).submit(providerPayload);
    const databaseVersion = repo.updateSceneVersion(version.id, { providerJobId: job.providerJobId ?? null })!;
    return NextResponse.json({ version: databaseVersion, sourceContext: { exactNarrationText: persistedScene.exactText }, scenePrompt: { subject: project.productionBible?.characters ?? [], action: persistedScene.promptNotes, environment: project.productionBible?.environments ?? [], lighting: project.productionBible?.visualStyle.text, cameraMovement: persistedScene.cameraIntent, visualMood: persistedScene.mood, duration: sourceDurationSeconds * 1_000, aspectRatio: "9:16", visualPrompt, selectedReferences, negativeVisualConstraints: silentVideoNegativePrompt, providerStatus: "QUEUED" } }, { status: 201 });
  } catch (error) {
    repo.updateSceneVersion(version.id, { status: "FAILED", errorMessage: error instanceof Error ? error.message : "Video generation failed." });
    return NextResponse.json({ error: { code: "VIDEO_GENERATION_FAILED", message: error instanceof Error ? error.message : "Could not generate video." }, versionId: version.id }, { status: 502 });
  }
}

function projectAllowsShots(status?: string) { return status === "SHOT_GENERATION" || status === "SHOT_REVIEW" || status === "VOICE_REVIEW" || status === "READY_TO_RENDER" || status === "COMPLETE"; }
