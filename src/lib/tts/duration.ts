import { spawn } from "node:child_process";

export function measureAudioDurationMs(audioPath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const child = spawn("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", audioPath]);
    let stdout = ""; let stderr = "";
    child.stdout.on("data", (data) => { stdout += data; }); child.stderr.on("data", (data) => { stderr += data; });
    child.on("error", reject); child.on("close", (code) => {
      const seconds = Number.parseFloat(stdout.trim());
      if (code !== 0 || !Number.isFinite(seconds)) return reject(new Error(`ffprobe could not measure audio duration: ${stderr || stdout}`));
      resolve(Math.round(seconds * 1000));
    });
  });
}

export const targetVideoDurationMs = (audioDurationMs: number) => audioDurationMs + 1_200;
