import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import type { VideoJob, VideoJobStatus, VideoProvider, VideoRequest } from "./provider";

type Job = { createdAt: number; outputPath: string; durationMs: number; failed?: string };

function runFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: "ignore" });
    child.once("error", reject);
    child.once("close", (code) => code === 0 ? resolve() : reject(new Error(`FFmpeg exited with code ${code ?? "unknown"}.`)));
  });
}

/** Local deterministic adapter: polling moves QUEUED -> GENERATING -> READY. */
export class MockVideoProvider implements VideoProvider {
  private readonly jobs = new Map<string, Job>();

  async submit(input: VideoRequest): Promise<VideoJob> {
    const providerJobId = `mock-${randomUUID()}`;
    const job: Job = { createdAt: Date.now(), outputPath: input.outputPath, durationMs: input.targetDurationMs };
    this.jobs.set(providerJobId, job);
    try {
      await fs.mkdir(path.dirname(input.outputPath), { recursive: true });
      const duration = Math.max(0.5, input.targetDurationMs / 1000);
      await runFfmpeg(["-y", "-f", "lavfi", "-i", "color=c=0x182230:s=360x640:r=24", "-t", String(duration), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", input.outputPath]);
    } catch (error) { job.failed = error instanceof Error ? error.message : "Could not create placeholder video."; }
    return { provider: "mock", providerJobId, outputPath: input.outputPath };
  }

  async getStatus(job: VideoJob): Promise<VideoJobStatus> {
    const item = job.providerJobId ? this.jobs.get(job.providerJobId) : undefined;
    if (!item) return { status: "FAILED", errorMessage: "Mock job is unavailable after restart. Generate another version." };
    if (item.failed) return { status: "FAILED", errorMessage: item.failed };
    const elapsed = Date.now() - item.createdAt;
    if (elapsed < 100) return { status: "QUEUED" };
    if (elapsed < 300) return { status: "GENERATING" };
    return { status: "READY", videoPath: item.outputPath, durationMs: item.durationMs };
  }
}
