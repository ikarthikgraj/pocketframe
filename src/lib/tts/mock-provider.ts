import fs from "node:fs/promises";
import path from "node:path";
import type { TtsProvider, TtsRequest, TtsResult } from "./provider";

function wavBuffer(durationSeconds: number): Buffer {
  const sampleRate = 16_000; const samples = Math.ceil(sampleRate * durationSeconds); const dataSize = samples * 2;
  const buffer = Buffer.alloc(44 + dataSize);
  buffer.write("RIFF", 0); buffer.writeUInt32LE(36 + dataSize, 4); buffer.write("WAVE", 8); buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16); buffer.writeUInt16LE(1, 20); buffer.writeUInt16LE(1, 22); buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28); buffer.writeUInt16LE(2, 32); buffer.writeUInt16LE(16, 34); buffer.write("data", 36); buffer.writeUInt32LE(dataSize, 40);
  return buffer;
}

export class MockTtsProvider implements TtsProvider {
  async synthesize(input: TtsRequest): Promise<TtsResult> {
    const wordCount = input.exactText.trim().split(/\s+/).filter(Boolean).length;
    await fs.mkdir(path.dirname(input.outputPath), { recursive: true });
    await fs.writeFile(input.outputPath, wavBuffer(Math.max(1, wordCount / 2.5)));
    return { provider: "mock", model: "fixture-wav", audioPath: input.outputPath };
  }
}
