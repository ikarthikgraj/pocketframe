import { getConfig } from "@/lib/config";
import path from "node:path";
import { GeminiTtsProvider } from "./gemini-provider";
import { ElevenLabsTtsProvider } from "./elevenlabs-provider";
import { MockTtsProvider } from "./mock-provider";
import type { TtsProvider } from "./provider";

export function getTtsProvider(): TtsProvider {
  if (process.env.POCKETFRAME_TTS_PROVIDER === "elevenlabs") return new ElevenLabsTtsProvider();
  return process.env.POCKETFRAME_TTS_PROVIDER === "gemini" ? new GeminiTtsProvider() : new MockTtsProvider();
}

export function audioExtension(): "mp3" | "wav" { return process.env.POCKETFRAME_TTS_PROVIDER === "elevenlabs" ? "mp3" : "wav"; }

export function audioAbsolutePath(relativePath: string): string { return path.join(getConfig().dataDirectory, relativePath); }
