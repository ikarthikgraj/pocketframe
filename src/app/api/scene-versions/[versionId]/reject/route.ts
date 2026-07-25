import { NextResponse } from "next/server";
import { repositories } from "@/lib/db";
import { rejectSceneVersionSchema } from "@/lib/domain/contracts";
export const runtime = "nodejs";
type Context = { params: Promise<{ versionId: string }> };
export async function POST(request: Request, { params }: Context) { const input = rejectSceneVersionSchema.safeParse(await request.json().catch(() => ({}))); if (!input.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Provide a valid rejection reason." } }, { status: 400 }); const version = repositories().rejectSceneVersion((await params).versionId, input.data.reason); return version ? NextResponse.json({ versionId: version.id, sceneId: version.sceneId, status: version.status }) : NextResponse.json({ error: { code: "VERSION_NOT_REJECTABLE", message: "An approved or missing version cannot be rejected." } }, { status: 409 }); }
