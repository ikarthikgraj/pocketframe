import fs from "node:fs/promises";
import path from "node:path";
import type { TtsProvider, TtsRequest, TtsResult } from "./provider";

type ElevenLabsSettings = { apiKey: string; voiceId: string; model: string; endpoint: string };
const requestedVoiceId = "swh0hLPsEaD50F02tIJJ";

function settings(env: NodeJS.ProcessEnv = process.env): ElevenLabsSettings {
  const apiKey = env.ELEVENLABS_API_KEY; const voiceId = env.ELEVENLABS_VOICE_ID ?? requestedVoiceId;
  if (!apiKey) throw new Error("ElevenLabs TTS requires ELEVENLABS_API_KEY in .env.local.");
  return { apiKey, voiceId, model: env.ELEVENLABS_MODEL ?? "eleven_multilingual_v2", endpoint: env.ELEVENLABS_ENDPOINT ?? "https://api.elevenlabs.io/v1" };
}

export class ElevenLabsTtsProvider implements TtsProvider {
  async synthesize(input: TtsRequest): Promise<TtsResult> {
    const config = settings();
    const response = await fetch(`${config.endpoint}/text-to-speech/${encodeURIComponent(config.voiceId)}`, { method: "POST", headers: { "xi-api-key": config.apiKey, "Content-Type": "application/json", Accept: "audio/mpeg" }, body: JSON.stringify({ text: input.exactText, model_id: config.model, voice_settings: { stability: 0.5, similarity_boost: 0.75, style: 0.35, use_speaker_boost: true } }) });
    if (!response.ok) throw new Error(`ElevenLabs TTS failed: ${response.status} ${await response.text()}`);
    await fs.mkdir(path.dirname(input.outputPath), { recursive: true }); await fs.writeFile(input.outputPath, Buffer.from(await response.arrayBuffer()));
    return { provider: "elevenlabs", model: config.model, audioPath: input.outputPath, providerRequestId: response.headers.get("request-id") ?? undefined };
  }
}
