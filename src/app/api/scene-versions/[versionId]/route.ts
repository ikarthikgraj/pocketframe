import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { repositories } from "@/lib/db";
import { getConfig } from "@/lib/config";
import { isSafeMediaPath, videoAbsolutePath, getVideoProvider } from "@/lib/video";
import { rejectSceneVersionSchema } from "@/lib/domain/contracts";

export const runtime = "nodejs";
type Context = { params: Promise<{ versionId: string }> };

export async function GET(request: Request, { params }: Context) {
  const versionId = (await params).versionId;
  const { searchParams } = new URL(request.url);
  const repo = repositories();
  const version = repo.getSceneVersion(versionId);

  if (!version) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Video version not found." } }, { status: 404 });

  if (searchParams.get("media") === "video") {
    if (!version.videoPath || !isSafeMediaPath(version.videoPath)) {
      return NextResponse.json({ error: { code: "VIDEO_NOT_READY", message: "Video is not available." } }, { status: 404 });
    }
    try {
      return new NextResponse(await fs.readFile(videoAbsolutePath(version.videoPath)), {
        headers: { "Content-Type": "video/mp4", "Cache-Control": "no-store" },
      });
    } catch {
      return NextResponse.json({ error: { code: "VIDEO_FILE_NOT_FOUND", message: "Video file is unavailable." } }, { status: 404 });
    }
  }

  if (version.provider === "manual" || ["READY", "APPROVED", "REJECTED", "FAILED"].includes(version.status)) {
    return NextResponse.json(version);
  }

  try {
    const job = {
      provider: version.provider,
      providerJobId: version.providerJobId ?? undefined,
      outputPath: version.videoPath ? path.join(getConfig().dataDirectory, version.videoPath) : "",
    };
    const result = await getVideoProvider(version.provider as "mock" | "real").getStatus(job);
    const updated = repo.updateSceneVersion(version.id, {
      status: result.status,
      videoPath: result.videoPath ? path.relative(getConfig().dataDirectory, result.videoPath).split(path.sep).join("/") : version.videoPath,
      durationMs: result.durationMs,
      errorMessage: result.errorMessage,
    });
    return NextResponse.json(updated);
  } catch (error) {
    const updated = repo.updateSceneVersion(version.id, {
      status: "FAILED",
      errorMessage: error instanceof Error ? error.message : "Could not poll video job.",
    });
    return NextResponse.json(updated);
  }
}

export async function POST(request: Request, { params }: Context) {
  const versionId = (await params).versionId;
  const repo = repositories();
  const body = await request.json().catch(() => ({}));

  if (body.action === "reject") {
    const input = rejectSceneVersionSchema.safeParse(body);
    if (!input.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Provide a valid rejection reason." } }, { status: 400 });
    const version = repo.rejectSceneVersion(versionId, input.data.reason);
    return version
      ? NextResponse.json({ versionId: version.id, sceneId: version.sceneId, status: version.status })
      : NextResponse.json({ error: { code: "VERSION_NOT_REJECTABLE", message: "An approved or missing version cannot be rejected." } }, { status: 409 });
  }

  const version = repo.approveSceneVersion(versionId);
  return version
    ? NextResponse.json({ versionId: version.id, sceneId: version.sceneId, status: version.status })
    : NextResponse.json({ error: { code: "VERSION_NOT_READY", message: "Only a ready video version can be approved." } }, { status: 409 });
}
