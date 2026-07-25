import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { repositories } from "@/lib/db";
import { isSafeMediaPath, videoAbsolutePath } from "@/lib/video";
export const runtime = "nodejs";
type Context = { params: Promise<{ versionId: string }> };
export async function GET(_: Request, { params }: Context) { const version = repositories().getSceneVersion((await params).versionId); if (!version?.videoPath || !isSafeMediaPath(version.videoPath)) return NextResponse.json({ error: { code: "VIDEO_NOT_READY", message: "Video is not available." } }, { status: 404 }); try { return new NextResponse(await fs.readFile(videoAbsolutePath(version.videoPath)), { headers: { "Content-Type": "video/mp4", "Cache-Control": "no-store" } }); } catch { return NextResponse.json({ error: { code: "VIDEO_FILE_NOT_FOUND", message: "Video file is unavailable." } }, { status: 404 }); } }
