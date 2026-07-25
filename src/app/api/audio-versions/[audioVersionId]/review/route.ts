import { NextResponse } from "next/server";
import { repositories } from "@/lib/db";
import { audioVersionActionSchema } from "@/lib/domain/contracts";

export const runtime = "nodejs";
type Context = { params: Promise<{ audioVersionId: string }> };

export async function PATCH(request: Request, { params }: Context) {
  const input = audioVersionActionSchema.safeParse(await request.json().catch(() => ({})));
  if (!input.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Choose select, approve, or reject." } }, { status: 400 });
  const id = (await params).audioVersionId; const repo = repositories();
  if (input.data.action === "select") {
    const version = repo.selectAudioVersion(id);
    return version ? NextResponse.json({ version }) : NextResponse.json({ error: { code: "AUDIO_NOT_AVAILABLE", message: "This audio version cannot be selected." } }, { status: 409 });
  }
  if (input.data.action === "reject") {
    const version = repo.rejectAudioVersion(id);
    return version ? NextResponse.json({ version }) : NextResponse.json({ error: { code: "AUDIO_NOT_AVAILABLE", message: "Approved audio cannot be rejected. Approve another version instead." } }, { status: 409 });
  }
  const version = repo.getAudioVersion(id); const scene = version && repo.approveAudioVersion(id);
  return scene ? NextResponse.json({ scene }) : NextResponse.json({ error: { code: "OUTDATED_SCRIPT", message: "Generate and approve a version for the current narration script." } }, { status: 409 });
}
