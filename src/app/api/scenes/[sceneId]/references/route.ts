import { NextResponse } from "next/server";
import { repositories } from "@/lib/db";
import { setSceneReferencesSchema } from "@/lib/domain/contracts";

export const runtime = "nodejs";
type Context = { params: Promise<{ sceneId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const input = setSceneReferencesSchema.safeParse(await request.json().catch(() => ({})));
  if (!input.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Select up to three references.", details: input.error.flatten() } }, { status: 400 });
  const repo = repositories(); const scene = repo.getScene((await params).sceneId);
  if (!scene) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Scene not found." } }, { status: 404 });
  try {
    const updated = repo.setSceneReferenceIds(scene.id, input.data.referenceIds);
    return NextResponse.json({ scene: updated });
  } catch (error) { return NextResponse.json({ error: { code: "INVALID_REFERENCES", message: error instanceof Error ? error.message.replace("INVALID_REFERENCES: ", "") : "Could not update scene references." } }, { status: 400 }); }
}
