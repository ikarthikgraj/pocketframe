import path from "node:path";
import { getConfig } from "../src/lib/config";
import { audioExtension, getTtsProvider } from "../src/lib/tts";
import { measureAudioDurationMs } from "../src/lib/tts/duration";

async function main() {
  if (!new Set(["gemini", "elevenlabs"]).has(process.env.POCKETFRAME_TTS_PROVIDER ?? "")) throw new Error("Set POCKETFRAME_TTS_PROVIDER=elevenlabs or gemini in .env.local before running this smoke test.");
  const outputPath = path.join(getConfig().dataDirectory, "smoke", `${process.env.POCKETFRAME_TTS_PROVIDER}-tts-smoke.${audioExtension()}`);
  const result = await getTtsProvider().synthesize({ exactText: "This is a PocketFrame TTS smoke test.", performancePrompt: "Speak naturally and clearly.", outputPath, languageCode: "en-IN", quality: "preview" });
  console.log(JSON.stringify({ provider: result.provider, model: result.model, outputPath, durationMs: await measureAudioDurationMs(outputPath) }));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
