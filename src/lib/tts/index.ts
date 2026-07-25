import { getConfig } from "@/lib/config";
import path from "node:path";
import { GeminiTtsProvider } from "./gemini-provider";
import { MockTtsProvider } from "./mock-provider";
import type { TtsProvider } from "./provider";

export function getTtsProvider(): TtsProvider {
  return process.env.POCKETFRAME_TTS_PROVIDER === "gemini" ? new GeminiTtsProvider() : new MockTtsProvider();
}

export function audioAbsolutePath(relativePath: string): string { return path.join(getConfig().dataDirectory, relativePath); }
