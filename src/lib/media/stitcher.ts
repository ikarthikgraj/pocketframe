import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { getConfig } from "@/lib/config";

export type ApprovedRenderScene = { sceneId: string; sceneNumber: number; exactText: string; videoPath: string; audioPath: string; audioDurationMs: number; targetDurationMs: number };
export type RenderRequest = { projectId: string; renderVersion: number; title: string; tagline: string; cta: string; scenes: ApprovedRenderScene[]; subtitles: boolean; musicPath?: string | null; onStage?: (stage: number) => void | Promise<void> };
export type MediaProbe = { durationMs: number; videoCodec: string; audioCodec: string; width: number; height: number; fps: number; pixelFormat: string };

const outputVideoFilter = "scale=1080:1920:force_original_aspect_ratio=increase,crop=1080:1920,fps=24,format=yuv420p";
const escapeSrt = (value: string) => value.replace(/-->/g, "→").replace(/\r?\n/g, " ");
const glyphs: Record<string, string[]> = { A:["01110","10001","10001","11111","10001","10001","10001"], B:["11110","10001","10001","11110","10001","10001","11110"], C:["01111","10000","10000","10000","10000","10000","01111"], D:["11110","10001","10001","10001","10001","10001","11110"], E:["11111","10000","10000","11110","10000","10000","11111"], F:["11111","10000","10000","11110","10000","10000","10000"], G:["01111","10000","10000","10111","10001","10001","01111"], H:["10001","10001","10001","11111","10001","10001","10001"], I:["11111","00100","00100","00100","00100","00100","11111"], J:["00111","00010","00010","00010","10010","10010","01100"], K:["10001","10010","10100","11000","10100","10010","10001"], L:["10000","10000","10000","10000","10000","10000","11111"], M:["10001","11011","10101","10101","10001","10001","10001"], N:["10001","11001","10101","10011","10001","10001","10001"], O:["01110","10001","10001","10001","10001","10001","01110"], P:["11110","10001","10001","11110","10000","10000","10000"], Q:["01110","10001","10001","10001","10101","10010","01101"], R:["11110","10001","10001","11110","10100","10010","10001"], S:["01111","10000","10000","01110","00001","00001","11110"], T:["11111","00100","00100","00100","00100","00100","00100"], U:["10001","10001","10001","10001","10001","10001","01110"], V:["10001","10001","10001","10001","10001","01010","00100"], W:["10001","10001","10001","10101","10101","10101","01010"], X:["10001","10001","01010","00100","01010","10001","10001"], Y:["10001","10001","01010","00100","00100","00100","00100"], Z:["11111","00001","00010","00100","01000","10000","11111"], " ":["00000","00000","00000","00000","00000","00000","00000"], ".":["00000","00000","00000","00000","00000","00110","00110"], "!":["00100","00100","00100","00100","00100","00000","00100"], "0":["01110","10001","10011","10101","11001","10001","01110"], "1":["00100","01100","00100","00100","00100","00100","01110"], "2":["01110","10001","00001","00010","00100","01000","11111"], "3":["11110","00001","00001","01110","00001","00001","11110"], "4":["00010","00110","01010","10010","11111","00010","00010"], "5":["11111","10000","10000","11110","00001","00001","11110"], "6":["01110","10000","10000","11110","10001","10001","01110"], "7":["11111","00001","00010","00100","01000","01000","01000"], "8":["01110","10001","10001","01110","10001","10001","01110"], "9":["01110","10001","10001","01111","00001","00001","01110"] };
async function writeTitleCardImage(filePath: string, lines: Array<{ text: string; y: number; scale: number }>) { const width = 1080; const height = 1920; const pixels = Buffer.alloc(width * height * 3, 0); for (const line of lines) { const text = line.text.toUpperCase().slice(0, 48); const textWidth = text.length * 6 * line.scale; let x = Math.max(30, Math.floor((width - textWidth) / 2)); for (const char of text) { const glyph = glyphs[char] ?? glyphs[" "]; for (let row = 0; row < 7; row++) for (let column = 0; column < 5; column++) if (glyph[row]![column] === "1") for (let dy = 0; dy < line.scale; dy++) for (let dx = 0; dx < line.scale; dx++) { const px = x + column * line.scale + dx; const py = line.y + row * line.scale + dy; if (px >= 0 && px < width && py >= 0 && py < height) pixels[(py * width + px) * 3] = pixels[(py * width + px) * 3 + 1] = pixels[(py * width + px) * 3 + 2] = 255; } x += 6 * line.scale; } } await fs.writeFile(filePath, Buffer.concat([Buffer.from(`P6\n${width} ${height}\n255\n`), pixels])); }

export function sceneOutputDurationMs(scene: Pick<ApprovedRenderScene, "audioDurationMs" | "targetDurationMs">) {
  return Math.max(scene.audioDurationMs, scene.targetDurationMs);
}
export function orderedScenes<T extends { sceneNumber: number }>(scenes: T[]) { return [...scenes].sort((a, b) => a.sceneNumber - b.sceneNumber); }

function run(command: string, args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, { stdio: ["ignore", "pipe", "pipe"] }); let stderr = "";
    child.stderr.on("data", (chunk) => { stderr += String(chunk); });
    child.once("error", (error) => reject(error));
    child.once("close", (code) => code === 0 ? resolve() : reject(new Error(`${command} exited with code ${code ?? "unknown"}: ${stderr.slice(-800)}`)));
  });
}

export async function probeMp4(filePath: string): Promise<MediaProbe> {
  return new Promise((resolve, reject) => {
    const child = spawn("ffprobe", ["-v", "error", "-show_entries", "format=duration:stream=codec_type,codec_name,width,height,pix_fmt,r_frame_rate", "-of", "json", filePath], { stdio: ["ignore", "pipe", "pipe"] }); let stdout = ""; let stderr = "";
    child.stdout.on("data", (chunk) => { stdout += String(chunk); }); child.stderr.on("data", (chunk) => { stderr += String(chunk); });
    child.once("error", reject); child.once("close", (code) => {
      try {
        const value = JSON.parse(stdout) as { format?: { duration?: string }; streams?: Array<{ codec_type: string; codec_name?: string; width?: number; height?: number; pix_fmt?: string; r_frame_rate?: string }> };
        const video = value.streams?.find((stream) => stream.codec_type === "video"); const audio = value.streams?.find((stream) => stream.codec_type === "audio");
        const [numerator, denominator] = (video?.r_frame_rate ?? "0/1").split("/").map(Number);
        const durationMs = Math.round(Number(value.format?.duration) * 1000);
        if (code !== 0 || !video || !audio || !Number.isFinite(durationMs)) throw new Error(stderr || "Incomplete MP4 stream metadata.");
        resolve({ durationMs, videoCodec: video.codec_name ?? "", audioCodec: audio.codec_name ?? "", width: video.width ?? 0, height: video.height ?? 0, fps: denominator ? numerator / denominator : 0, pixelFormat: video.pix_fmt ?? "" });
      } catch (error) { reject(error instanceof Error ? error : new Error("Could not validate MP4.")); }
    });
  });
}

export function assertTrailerFormat(probe: MediaProbe) {
  if (probe.videoCodec !== "h264" || probe.audioCodec !== "aac" || probe.width !== 1080 || probe.height !== 1920 || Math.abs(probe.fps - 24) > 0.1 || probe.pixelFormat !== "yuv420p") throw new Error("Final output does not meet the MP4/H.264/AAC 1080x1920 24fps format requirement.");
}

function srtTimestamp(ms: number) { const total = Math.max(0, Math.round(ms)); const hours = Math.floor(total / 3_600_000); const minutes = Math.floor((total % 3_600_000) / 60_000); const seconds = Math.floor((total % 60_000) / 1_000); return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")},${String(total % 1_000).padStart(3, "0")}`; }

export async function stitchTrailer(request: RenderRequest): Promise<{ outputPath: string; durationMs: number; mockFallback: boolean }> {
  const root = getConfig().dataDirectory; const renderDir = path.join(root, "projects", request.projectId, "renders"); const tempDir = path.join(root, "projects", request.projectId, "temp", `render-v${request.renderVersion}`);
  await fs.mkdir(renderDir, { recursive: true }); await fs.mkdir(tempDir, { recursive: true });
  const scenes = orderedScenes(request.scenes); if (!scenes.length) throw new Error("No approved scenes are available for rendering.");
  const outputPath = path.join(renderDir, `final-v${request.renderVersion}.mp4`); const normalized: string[] = [];
  try {
    await request.onStage?.(2);
    for (const scene of scenes) {
      const output = path.join(tempDir, `scene-${String(scene.sceneNumber).padStart(2, "0")}.mp4`); const durationMs = sceneOutputDurationMs(scene); const duration = (durationMs / 1000).toFixed(3);
      await request.onStage?.(3);
      let filter = `${outputVideoFilter},tpad=stop_mode=clone:stop_duration=${duration},trim=duration=${duration},setpts=PTS-STARTPTS`;
      if (request.subtitles) {
        const subtitle = path.join(tempDir, `scene-${String(scene.sceneNumber).padStart(2, "0")}.srt`); await fs.writeFile(subtitle, `1\n00:00:00,000 --> ${srtTimestamp(scene.audioDurationMs)}\n${escapeSrt(scene.exactText)}\n`);
        filter += `,subtitles=filename='${subtitle.replace(/\\/g, "\\\\").replace(/:/g, "\\:").replace(/'/g, "\\'")}'`;
      }
      await request.onStage?.(4); await request.onStage?.(5);
      await run("ffmpeg", ["-y", "-i", path.join(root, scene.videoPath), "-i", path.join(root, scene.audioPath), "-filter_complex", `[0:v]${filter}[video];[1:a]apad=pad_dur=${duration}[audio]`, "-map", "[video]", "-map", "[audio]", "-t", duration, "-r", "24", "-c:v", "libx264", "-preset", "fast", "-pix_fmt", "yuv420p", "-c:a", "aac", "-movflags", "+faststart", output]);
      normalized.push(output);
    }
    const titleCard = path.join(tempDir, "title-card.mp4"); const cardImage = path.join(tempDir, "title-card.ppm"); await writeTitleCardImage(cardImage, [{ text: request.title, y: 730, scale: 10 }, { text: request.tagline, y: 940, scale: 5 }, { text: request.cta, y: 1140, scale: 5 }]);
    await run("ffmpeg", ["-y", "-loop", "1", "-i", cardImage, "-f", "lavfi", "-i", "anullsrc=r=48000:cl=stereo", "-map", "0:v", "-map", "1:a", "-t", "3", "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "24", "-c:a", "aac", titleCard]);
    const manifest = path.join(tempDir, "concat.txt"); await fs.writeFile(manifest, [...normalized, titleCard].map((file) => `file '${file.replace(/'/g, "'\\''")}'`).join("\n")); const joined = path.join(tempDir, "joined.mp4");
    await run("ffmpeg", ["-y", "-f", "concat", "-safe", "0", "-i", manifest, "-c", "copy", joined]);
    const expectedDurationMs = scenes.reduce((total, scene) => total + sceneOutputDurationMs(scene), 0) + 3_000;
    await request.onStage?.(6); await request.onStage?.(7);
    if (request.musicPath) {
      await run("ffmpeg", ["-y", "-i", joined, "-stream_loop", "-1", "-i", path.join(root, request.musicPath), "-filter_complex", `[1:a]volume=0.12,afade=t=in:st=0:d=1,afade=t=out:st=${Math.max(0, expectedDurationMs / 1000 - 1).toFixed(3)}:d=1[music];[0:a][music]amix=inputs=2:duration=first:dropout_transition=0[audio]`, "-map", "0:v", "-map", "[audio]", "-t", (expectedDurationMs / 1000).toFixed(3), "-c:v", "copy", "-c:a", "aac", "-movflags", "+faststart", outputPath]);
    } else await run("ffmpeg", ["-y", "-i", joined, "-t", (expectedDurationMs / 1000).toFixed(3), "-c:v", "libx264", "-pix_fmt", "yuv420p", "-r", "24", "-c:a", "aac", "-movflags", "+faststart", outputPath]);
    await request.onStage?.(8); const probe = await probeMp4(outputPath); assertTrailerFormat(probe); return { outputPath: path.relative(root, outputPath), durationMs: probe.durationMs, mockFallback: false };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
    // Safe offline fallback: preserve the approved source, never replace an existing final render.
    await fs.copyFile(path.join(root, scenes[0]!.videoPath), outputPath);
    return { outputPath: path.relative(root, outputPath), durationMs: sceneOutputDurationMs(scenes[0]!), mockFallback: true };
  } finally { await fs.rm(tempDir, { recursive: true, force: true }); }
}
