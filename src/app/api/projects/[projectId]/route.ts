import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { repositories } from "@/lib/db";
import { updateProjectSchema } from "@/lib/domain/contracts";
import { getConfig } from "@/lib/config";

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
  if (!/^[0-9a-f-]{36}$/i.test(projectId)) return NextResponse.json({ error: { code: "INVALID_PROJECT", message: "Invalid project id." } }, { status: 400 });
  const root = path.resolve(getConfig().dataDirectory, "projects");
  const mediaDirectory = path.resolve(root, projectId);
  if (!mediaDirectory.startsWith(`${root}${path.sep}`)) return NextResponse.json({ error: { code: "UNSAFE_PATH", message: "Project media path is invalid." } }, { status: 400 });
  const deleted = repositories().deleteProject(projectId);
  if (!deleted) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
  try {
    await fs.rm(mediaDirectory, { recursive: true, force: true });
    return NextResponse.json({ deletedProjectId: projectId, mediaDeleted: true });
  } catch (error) {
    console.error({ operation: "delete_project_media", projectId, mediaDirectory, error });
    return NextResponse.json({ deletedProjectId: projectId, mediaDeleted: false, warning: "The project record was deleted, but its media folder could not be removed. The orphaned folder was logged." });
  }
}
