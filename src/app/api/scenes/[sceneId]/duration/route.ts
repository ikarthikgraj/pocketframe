import { NextResponse } from "next/server";
import { repositories } from "@/lib/db";
import { supportedVideoDurations } from "@/lib/video/duration";

export const runtime = "nodejs";
type Context = { params: Promise<{ sceneId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const body = await request.json().catch(() => ({}));
  const durationSeconds = body.durationSeconds;
  if (durationSeconds !== null && (!Number.isInteger(durationSeconds) || !supportedVideoDurations.includes(durationSeconds))) return NextResponse.json({ error: { code: "UNSUPPORTED_DURATION", message: `Choose Auto or ${supportedVideoDurations.join(", ")} seconds.` } }, { status: 400 });
  const scene = repositories().setSceneVideoDuration((await params).sceneId, durationSeconds);
  if (!scene) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Scene not found." } }, { status: 404 });
  return NextResponse.json({ scene });
}
