import { randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import fsSync from "node:fs";
import path from "node:path";
import type { VideoJob, VideoJobStatus, VideoProvider, VideoRequest } from "./provider";

type Job = { createdAt: number; outputPath: string; durationMs: number; failed?: string };

function runFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn("ffmpeg", args, { stdio: "ignore" });
    child.once("error", reject);
    child.once("close", (code) => (code === 0 ? resolve() : reject(new Error(`FFmpeg exited with code ${code ?? "unknown"}.`))));
  });
}

function findCustomClip(outputPath: string): string | null {
  let filename: string | null = null;
  if (outputPath.includes("scene-01") || outputPath.includes("scene-1")) {
    filename = "01.mp4";
  } else if (outputPath.includes("scene-02") || outputPath.includes("scene-2")) {
    filename = "02.mp4";
  }
  if (!filename) return null;
  const candidates = [
    path.resolve(process.cwd(), "..", filename),
    path.resolve(process.cwd(), filename),
    path.resolve(process.cwd(), "public", filename),
  ];
  for (const candidate of candidates) {
    if (fsSync.existsSync(candidate)) return candidate;
  }
  return null;
}

/** Local deterministic adapter: polling moves QUEUED -> GENERATING -> READY. */
export class MockVideoProvider implements VideoProvider {
  private readonly jobs = new Map<string, Job>();

  async submit(input: VideoRequest): Promise<VideoJob> {
    const providerJobId = `mock-${randomUUID()}`;
    const job: Job = { createdAt: 0, outputPath: input.outputPath, durationMs: input.targetDurationMs };
    this.jobs.set(providerJobId, job);
    try {
      await fs.mkdir(path.dirname(input.outputPath), { recursive: true });
      const customClip = findCustomClip(input.outputPath);
      if (customClip) {
        await fs.copyFile(customClip, input.outputPath);
      } else {
        const duration = Math.max(0.5, input.targetDurationMs / 1000);
        await runFfmpeg(["-y", "-f", "lavfi", "-i", "color=c=0x182230:s=360x640:r=24", "-t", String(duration), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-movflags", "+faststart", input.outputPath]);
      }
      // Simulate realistic generation delay for UI animation
      await new Promise((resolve) => setTimeout(resolve, 800));
    } catch (error) {
      job.failed = error instanceof Error ? error.message : "Could not create video clip.";
    }
    job.createdAt = Date.now();
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
