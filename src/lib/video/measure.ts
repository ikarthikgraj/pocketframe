import { spawn } from "node:child_process";

export function measureVideoDurationMs(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    const process = spawn("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=noprint_wrappers=1:nokey=1", filePath]); let output = "";
    process.stdout.on("data", (chunk) => { output += String(chunk); }); process.once("error", reject); process.once("close", (code) => { const seconds = Number(output.trim()); return code === 0 && Number.isFinite(seconds) && seconds > 0 ? resolve(Math.round(seconds * 1000)) : reject(new Error("Could not measure uploaded MP4 duration.")); });
  });
}
