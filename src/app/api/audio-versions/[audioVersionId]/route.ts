import fs from "node:fs/promises";
import { NextResponse } from "next/server";
import { repositories } from "@/lib/db";
import { audioAbsolutePath } from "@/lib/tts";

export const runtime = "nodejs";
type Context = { params: Promise<{ audioVersionId: string }> };

export async function GET(_: Request, { params }: Context) {
  const version = repositories().getAudioVersion((await params).audioVersionId);
  if (!version) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Audio version not found." } }, { status: 404 });
  try { return new NextResponse(await fs.readFile(audioAbsolutePath(version.audioPath)), { headers: { "Content-Type": "audio/wav", "Cache-Control": "no-store" } }); }
  catch { return NextResponse.json({ error: { code: "AUDIO_FILE_NOT_FOUND", message: "Audio file is unavailable." } }, { status: 404 }); }
}
