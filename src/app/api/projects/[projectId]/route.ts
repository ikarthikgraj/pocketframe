import { NextResponse } from "next/server";
import { repositories } from "@/lib/db";
import { updateProjectSchema } from "@/lib/domain/contracts";

export const runtime = "nodejs";
type Context = { params: Promise<{ projectId: string }> };

export async function GET(_: Request, { params }: Context) {
  const project = repositories().getProject((await params).projectId);
  return project ? NextResponse.json({ project }) : NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
}
export async function PATCH(request: Request, { params }: Context) {
  const body = await request.json().catch(() => undefined);
  const result = updateProjectSchema.safeParse(body);
  if (!result.success || Object.keys(result.data).length === 0) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Provide at least one valid project field.", details: result.success ? undefined : result.error.flatten() } }, { status: 400 });
  const project = repositories().updateProject((await params).projectId, result.data);
  return project ? NextResponse.json({ project }) : NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
}

export async function DELETE(_: Request, { params }: Context) {
  const projectId = (await params).projectId;
  const deleted = repositories().deleteProject(projectId);
  return deleted
    ? NextResponse.json({ success: true, message: "Project deleted successfully" })
    : NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
}

