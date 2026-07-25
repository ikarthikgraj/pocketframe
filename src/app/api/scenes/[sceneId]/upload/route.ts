import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { repositories } from "@/lib/db";
import { getConfig } from "@/lib/config";
import { measureVideoDurationMs } from "@/lib/video/measure";

export const runtime = "nodejs";
type Context = { params: Promise<{ sceneId: string }> };
const MAX_BYTES = 100 * 1024 * 1024;
const defaultNegativePrompt = "Manual replacement supplied by producer.";

export async function POST(request: Request, { params }: Context) {
  const repo = repositories(); const scene = repo.getScene((await params).sceneId);
  if (!scene) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Scene not found." } }, { status: 404 });
  if (scene.status !== "TTS_APPROVED" && !["VIDEO_QUEUED", "VIDEO_GENERATING", "VIDEO_REVIEW", "APPROVED"].includes(scene.status)) return NextResponse.json({ error: { code: "TTS_NOT_APPROVED", message: "Approve this scene's narration before uploading a shot." } }, { status: 409 });
  const form = await request.formData().catch(() => undefined); const file = form?.get("file");
  if (!(file instanceof File) || file.size === 0 || file.size > MAX_BYTES || (!file.type.includes("mp4") && !file.name.toLowerCase().endsWith(".mp4"))) return NextResponse.json({ error: { code: "INVALID_MEDIA", message: "Upload a non-empty MP4 no larger than 100 MB." } }, { status: 400 });
  const bytes = Buffer.from(await file.arrayBuffer());
  if (!bytes.subarray(4, 12).toString("ascii").includes("ftyp")) return NextResponse.json({ error: { code: "INVALID_MEDIA", message: "The uploaded file is not a valid MP4 container." } }, { status: 400 });
  const versionNumber = repo.listSceneVersions(scene.id).length + 1; const relativePath = path.posix.join("projects", scene.projectId, "videos", `scene-${String(scene.sceneNumber).padStart(2, "0")}-v${versionNumber}-original.mp4`); const output = path.join(getConfig().dataDirectory, relativePath);
  await fs.mkdir(path.dirname(output), { recursive: true }); await fs.writeFile(output, bytes);
  try { const durationMs = await measureVideoDurationMs(output); const submittedPrompt = form?.get("prompt"); const prompt = typeof submittedPrompt === "string" && submittedPrompt.trim() ? submittedPrompt.trim() : scene.promptNotes ?? "Manual replacement."; const version = repo.createSceneVersion({ sceneId: scene.id, provider: "manual", prompt, negativePrompt: scene.negativePrompt ?? defaultNegativePrompt, videoPath: relativePath, durationMs, status: "READY" }); return NextResponse.json({ version }, { status: 201 }); }
  catch (error) { await fs.unlink(output).catch(() => undefined); return NextResponse.json({ error: { code: "INVALID_MEDIA", message: error instanceof Error ? error.message : "Could not read the MP4." } }, { status: 400 }); }
}
