import fs from "node:fs/promises";
import path from "node:path";
import type { TtsProvider, TtsRequest, TtsResult } from "./provider";

type GeminiSettings = { apiKey: string; model: string; voice: string; endpoint: string };

function pcm16ToWav(pcm: Buffer, sampleRate: number): Buffer {
  const wav = Buffer.alloc(44 + pcm.length); wav.write("RIFF", 0); wav.writeUInt32LE(36 + pcm.length, 4); wav.write("WAVE", 8); wav.write("fmt ", 12);
  wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22); wav.writeUInt32LE(sampleRate, 24); wav.writeUInt32LE(sampleRate * 2, 28); wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34); wav.write("data", 36); wav.writeUInt32LE(pcm.length, 40); pcm.copy(wav, 44); return wav;
}

function settings(env: NodeJS.ProcessEnv = process.env): GeminiSettings {
  const apiKey = env.GEMINI_TTS_API_KEY; const model = env.GEMINI_TTS_MODEL; const voice = env.GEMINI_TTS_VOICE;
  if (!apiKey || !model || !voice) throw new Error("Gemini TTS requires GEMINI_TTS_API_KEY, GEMINI_TTS_MODEL, and GEMINI_TTS_VOICE in .env.local.");
  return { apiKey, model, voice, endpoint: env.GEMINI_TTS_ENDPOINT ?? "https://generativelanguage.googleapis.com/v1beta/models" };
}

export class GeminiTtsProvider implements TtsProvider {
  async synthesize(input: TtsRequest): Promise<TtsResult> {
    const config = settings();
    const textPrompt = `Perform this trailer narration in a high-energy and theatrical tone, with fast pacing and dramatic, suspenseful beats before reveals. Read the text naturally and expressively:\n\nNARRATION:\n${input.exactText}`;
    const response = await fetch(`${config.endpoint}/${encodeURIComponent(config.model)}:generateContent?key=${encodeURIComponent(config.apiKey)}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: textPrompt }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: config.voice } } },
        },
      }),
    });
    if (!response.ok) throw new Error(`Gemini TTS failed (${response.status}): ${await response.text()}`);
    const body = (await response.json()) as {
      candidates?: Array<{
        finishReason?: string;
        content?: {
          parts?: Array<{
            text?: string;
            inlineData?: { data?: string; mimeType?: string };
          }>;
        };
      }>;
    };
    const candidate = body.candidates?.[0];
    const inline = candidate?.content?.parts?.find((part) => part.inlineData?.data)?.inlineData;
    if (!inline?.data) {
      const textPart = candidate?.content?.parts?.find((part) => part.text)?.text;
      const reason = candidate?.finishReason ? ` (finish reason: ${candidate.finishReason})` : "";
      const textSnippet = textPart ? `: "${textPart.trim().slice(0, 150)}"` : "";
      throw new Error(`Gemini TTS response did not contain audio data${reason}${textSnippet}`);
    }
    const audio = Buffer.from(inline.data, "base64");
    const sampleRate = Number(inline.mimeType?.match(/rate=(\d+)/i)?.[1] ?? 24_000);
    await fs.mkdir(path.dirname(input.outputPath), { recursive: true });
    await fs.writeFile(input.outputPath, /audio\/L16/i.test(inline.mimeType ?? "") ? pcm16ToWav(audio, sampleRate) : audio);
    return { provider: "gemini", model: config.model, audioPath: input.outputPath };
  }
}
