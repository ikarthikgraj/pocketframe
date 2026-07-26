import { NextResponse } from "next/server";
import { repositories } from "@/lib/db";
import { supportedVideoDurations } from "@/lib/video/duration";
import { setSceneReferencesSchema, updateNarrationScriptSchema, approveTtsSchema } from "@/lib/domain/contracts";

export const runtime = "nodejs";
type Context = { params: Promise<{ sceneId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const sceneId = (await params).sceneId;
  const repo = repositories();
  const body = await request.json().catch(() => ({}));

  if ("narration" in body) {
    const input = updateNarrationScriptSchema.safeParse(body);
    if (!input.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Provide a narration script." } }, { status: 400 });
    const scene = repo.updateNarrationScript(sceneId, input.data.narration);
    return scene ? NextResponse.json({ scene }) : NextResponse.json({ error: { code: "NOT_FOUND", message: "Scene not found." } }, { status: 404 });
  }

  if ("referenceIds" in body) {
    const input = setSceneReferencesSchema.safeParse(body);
    if (!input.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Select up to three references.", details: input.error.flatten() } }, { status: 400 });
    const scene = repo.getScene(sceneId);
    if (!scene) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Scene not found." } }, { status: 404 });
    try {
      const updated = repo.setSceneReferenceIds(scene.id, input.data.referenceIds);
      return NextResponse.json({ scene: updated });
    } catch (error) {
      return NextResponse.json({ error: { code: "INVALID_REFERENCES", message: error instanceof Error ? error.message.replace("INVALID_REFERENCES: ", "") : "Could not update scene references." } }, { status: 400 });
    }
  }

  if ("durationSeconds" in body) {
    const durationSeconds = body.durationSeconds;
    if (durationSeconds !== null && (!Number.isInteger(durationSeconds) || !supportedVideoDurations.includes(durationSeconds))) {
      return NextResponse.json({ error: { code: "UNSUPPORTED_DURATION", message: `Choose Auto or ${supportedVideoDurations.join(", ")} seconds.` } }, { status: 400 });
    }
    const scene = repo.setSceneVideoDuration(sceneId, durationSeconds);
    if (!scene) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Scene not found." } }, { status: 404 });
    return NextResponse.json({ scene });
  }

  return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid patch body." } }, { status: 400 });
}

export async function POST(request: Request, { params }: Context) {
  const sceneId = (await params).sceneId;
  const repo = repositories();
  const body = await request.json().catch(() => ({}));

  if (body.approved) {
    const input = approveTtsSchema.safeParse(body);
    if (!input.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Approval must be true." } }, { status: 400 });
    const scene = repo.approveTts(sceneId);
    return scene ? NextResponse.json({ sceneId: scene.id, status: scene.status }) : NextResponse.json({ error: { code: "AUDIO_NOT_READY", message: "Generate audio before approval." } }, { status: 409 });
  }

  return NextResponse.json({ error: { code: "BAD_REQUEST", message: "Invalid post body." } }, { status: 400 });
}
