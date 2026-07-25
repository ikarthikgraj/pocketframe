import { NextResponse } from "next/server";
import { repositories } from "@/lib/db";
export const runtime = "nodejs";
type Context = { params: Promise<{ versionId: string }> };
export async function POST(_: Request, { params }: Context) { const version = repositories().approveSceneVersion((await params).versionId); return version ? NextResponse.json({ versionId: version.id, sceneId: version.sceneId, status: version.status }) : NextResponse.json({ error: { code: "VERSION_NOT_CURRENT", message: "Only the current latest review version can be approved." } }, { status: 409 }); }
