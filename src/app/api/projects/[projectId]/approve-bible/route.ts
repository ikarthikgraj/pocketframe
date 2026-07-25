import { NextResponse } from "next/server";
import { repositories } from "@/lib/db";

export const runtime = "nodejs";
type Context = { params: Promise<{ projectId: string }> };

export async function POST(_: Request, { params }: Context) {
  const project = repositories().approveProductionBible((await params).projectId);
  return project
    ? NextResponse.json({ project })
    : NextResponse.json({ error: { code: "BIBLE_NOT_READY", message: "Generate a Production Bible before approving it." } }, { status: 409 });
}
