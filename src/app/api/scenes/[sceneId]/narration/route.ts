import { NextResponse } from "next/server";
import { repositories } from "@/lib/db";
import { updateNarrationScriptSchema } from "@/lib/domain/contracts";

export const runtime = "nodejs";
type Context = { params: Promise<{ sceneId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const input = updateNarrationScriptSchema.safeParse(await request.json().catch(() => ({})));
  if (!input.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Provide a narration script." } }, { status: 400 });
  const scene = repositories().updateNarrationScript((await params).sceneId, input.data.narration);
  return scene ? NextResponse.json({ scene }) : NextResponse.json({ error: { code: "NOT_FOUND", message: "Scene not found." } }, { status: 404 });
}
