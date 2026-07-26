import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";
import { repositories } from "@/lib/db";
import { renderTrailerSchema } from "@/lib/domain/contracts";
import { stitchTrailer } from "@/lib/media/stitcher";

export const runtime = "nodejs";
type Context = { params: Promise<{ projectId: string }> };

export async function POST(request: Request, { params }: Context) {
  const projectId = (await params).projectId; const repo = repositories(); const project = repo.getProject(projectId);
  if (!project) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
  const multipart = request.headers.get("content-type")?.includes("multipart/form-data") ?? false; const form = multipart ? await request.formData().catch(() => undefined) : undefined;
  const parsed = renderTrailerSchema.safeParse(form ? { subtitles: form.get("subtitles") === "true", title: form.get("title") || undefined, cta: form.get("cta") || undefined } : await request.json().catch(() => ({})));
  if (!parsed.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Provide valid render settings.", details: parsed.error.flatten() } }, { status: 400 });
  const readiness = repo.getRenderReadiness(projectId);
  if (!readiness.ready) return NextResponse.json({ error: { code: "PROJECT_NOT_READY", message: "Approve narration and one video version for every scene before rendering.", retryable: false, details: { missingSceneIds: readiness.missingSceneIds } } }, { status: 409 });
  let musicPath: string | null = parsed.data.musicPath ?? null;
  const music = form?.get("music");
  if (music instanceof File && music.size > 0) {
    if (music.size > 30 * 1024 * 1024) return NextResponse.json({ error: { code: "INVALID_MEDIA", message: "Music must be no larger than 30 MB." } }, { status: 400 });
    const extension = path.extname(music.name).toLowerCase(); if (!new Set([".mp3", ".m4a", ".aac", ".wav"]).has(extension)) return NextResponse.json({ error: { code: "INVALID_MEDIA", message: "Upload MP3, M4A, AAC, or WAV music." } }, { status: 400 });
    musicPath = path.posix.join("projects", projectId, "input", `music-${Date.now()}${extension}`); const target = path.join(getConfig().dataDirectory, musicPath); await fs.mkdir(path.dirname(target), { recursive: true }); await fs.writeFile(target, Buffer.from(await music.arrayBuffer()));
  }
  const render = repo.createRenderVersion(projectId, musicPath);
  try {
    const approved = readiness.scenes.map((scene) => {
      const video = repo.listSceneVersions(scene.id).find((version) => version.status === "APPROVED"); const audio = repo.listAudioVersions(scene.id).find((version) => version.status === "APPROVED");
      if (!video?.videoPath || !audio) throw new Error(`Approved media is missing for scene ${scene.sceneNumber}.`);
      return { sceneId: scene.id, sceneNumber: scene.sceneNumber, exactText: scene.exactText, videoPath: video.videoPath, audioPath: audio.audioPath, audioDurationMs: audio.durationMs, targetDurationMs: scene.targetVideoDurationMs ?? audio.durationMs + 1200 };
    });
    const tagline = project.productionBible?.hook.text ?? project.productionBible?.premise.text ?? project.genre;
    const activeReference = project.references.find((r) => r.active !== false) ?? project.references[0];
    const referenceImagePath = activeReference?.localPath ?? null;
    const result = await stitchTrailer({ projectId, renderVersion: render.versionNumber, title: parsed.data.title ?? project.title, tagline, cta: parsed.data.cta, scenes: approved, subtitles: parsed.data.subtitles, musicPath, referenceImagePath, onStage: async (currentStage) => { repo.updateRenderVersion(render.id, { currentStage }); } });
  } catch (error) {
    const failed = repo.updateRenderVersion(render.id, { status: "FAILED", completedAt: new Date().toISOString(), errorMessage: error instanceof Error ? error.message : "Render failed." });
    return NextResponse.json({ error: { code: "RENDER_FAILED", message: failed?.errorMessage ?? "Render failed.", retryable: true }, render: failed }, { status: 500 });
  }
}

export async function GET(_: Request, { params }: Context) {
  const projectId = (await params).projectId;
  const repo = repositories();
  if (!repo.getProject(projectId)) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
  const readiness = repo.getRenderReadiness(projectId);
  const render = repo.getLatestRenderVersion(projectId);
  return NextResponse.json({ status: render?.status ?? (readiness.ready ? "READY" : "NOT_READY"), readiness, render, finalRenderPath: render?.outputPath ?? null, durationMs: render?.durationMs ?? null });
}
