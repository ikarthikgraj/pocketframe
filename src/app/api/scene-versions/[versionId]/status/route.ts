import path from "node:path";
import { NextResponse } from "next/server";
import { repositories } from "@/lib/db";
import { getConfig } from "@/lib/config";
import { getVideoProvider } from "@/lib/video";

export const runtime = "nodejs";
type Context = { params: Promise<{ versionId: string }> };
export async function GET(_: Request, { params }: Context) {
  const repo = repositories(); const version = repo.getSceneVersion((await params).versionId);
  if (!version) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Video version not found." } }, { status: 404 });
  if (version.provider === "manual" || ["READY", "APPROVED", "REJECTED", "FAILED"].includes(version.status)) return NextResponse.json(version);
  try {
    const job = { provider: version.provider, providerJobId: version.providerJobId ?? undefined, outputPath: version.videoPath ? path.join(getConfig().dataDirectory, version.videoPath) : "" };
    const result = await getVideoProvider(version.provider as "mock" | "real").getStatus(job);
    const updated = repo.updateSceneVersion(version.id, { status: result.status, videoPath: result.videoPath ? path.relative(getConfig().dataDirectory, result.videoPath).split(path.sep).join("/") : version.videoPath, durationMs: result.durationMs, errorMessage: result.errorMessage });
    return NextResponse.json(updated);
  } catch (error) { const updated = repo.updateSceneVersion(version.id, { status: "FAILED", errorMessage: error instanceof Error ? error.message : "Could not poll video job." }); return NextResponse.json(updated); }
}
