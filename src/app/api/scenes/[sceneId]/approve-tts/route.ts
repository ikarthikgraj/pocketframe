import { NextResponse } from "next/server";
import { repositories } from "@/lib/db";
import { approveTtsSchema } from "@/lib/domain/contracts";

export const runtime = "nodejs";
type Context = { params: Promise<{ sceneId: string }> };

export async function POST(request: Request, { params }: Context) {
  const input = approveTtsSchema.safeParse(await request.json().catch(() => ({})));
  if (!input.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Approval must be true." } }, { status: 400 });
  const scene = repositories().approveTts((await params).sceneId);
  return scene ? NextResponse.json({ sceneId: scene.id, status: scene.status }) : NextResponse.json({ error: { code: "AUDIO_NOT_READY", message: "Generate audio before approval." } }, { status: 409 });
}
