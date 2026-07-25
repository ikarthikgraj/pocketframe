import { NextResponse } from "next/server";
import { repositories } from "@/lib/db";

export const runtime = "nodejs";
type Context = { params: Promise<{ versionId: string }> };

export async function POST(_: Request, { params }: Context) {
  const version = repositories().unapproveSceneVersion((await params).versionId);
  return version ? NextResponse.json({ version }) : NextResponse.json({ error: { code: "VERSION_NOT_APPROVED", message: "Only the current approved shot can be unapproved." } }, { status: 409 });
}
