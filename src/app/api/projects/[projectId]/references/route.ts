import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { projectReferenceTypeSchema } from "@/lib/domain/contracts";
import { repositories } from "@/lib/db";
import { getConfig } from "@/lib/config";

export const runtime = "nodejs";
type Context = { params: Promise<{ projectId: string }> };
const allowedExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request, { params }: Context) {
  const projectId = (await params).projectId;
  const repo = repositories();
  if (!repo.getProject(projectId)) return response("NOT_FOUND", "Project not found.", 404);
  const form = await request.formData().catch(() => undefined);
  const parsed = parseForm(form);
  if (!parsed.ok) return response("VALIDATION_ERROR", parsed.message, 400);
  const { file, displayName, type, description, replaceId } = parsed.value;
  const existing = replaceId ? repo.getProject(projectId)?.references.find((reference) => reference.id === replaceId) : undefined;
  if (replaceId && !existing) return response("NOT_FOUND", "Reference not found.", 404);
  if (!replaceId && repo.getProject(projectId)!.references.length >= 3) return response("REFERENCE_LIMIT", "You can add up to 3 visual references per project.", 409);
  const extension = path.extname(file.name).toLowerCase();
  const filename = `${replaceId ?? crypto.randomUUID()}-${Date.now()}${extension}`;
  const localPath = path.posix.join("projects", projectId, "input", "references", filename);
  const target = path.join(getConfig().dataDirectory, localPath);
  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.writeFile(target, Buffer.from(await file.arrayBuffer()));
  try {
    const input = { displayName, type, localPath, description };
    const reference = replaceId ? repo.replaceProjectReference(projectId, replaceId, input) : repo.addProjectReference(projectId, input);
    if (!reference) throw new Error("Reference not found.");
    if (existing?.localPath) await fs.unlink(path.join(getConfig().dataDirectory, existing.localPath)).catch(() => undefined);
    return NextResponse.json({ reference }, { status: replaceId ? 200 : 201 });
  } catch (error) {
    await fs.unlink(target).catch(() => undefined);
    const message = error instanceof Error ? error.message : "Could not save this reference.";
    return response(message.startsWith("REFERENCE_LIMIT") ? "REFERENCE_LIMIT" : "REFERENCE_SAVE_FAILED", message.replace("REFERENCE_LIMIT: ", ""), message.startsWith("REFERENCE_LIMIT") ? 409 : 400);
  }
}

export async function DELETE(request: Request, { params }: Context) {
  const projectId = (await params).projectId;
  const referenceId = new URL(request.url).searchParams.get("referenceId");
  if (!referenceId) return response("VALIDATION_ERROR", "Choose a reference to remove.", 400);
  const reference = repositories().removeProjectReference(projectId, referenceId);
  if (!reference) return response("NOT_FOUND", "Reference not found.", 404);
  await fs.unlink(path.join(getConfig().dataDirectory, reference.localPath)).catch(() => undefined);
  return NextResponse.json({ removedReferenceId: referenceId });
}

export async function PATCH(request: Request, { params }: Context) {
  const projectId = (await params).projectId; const body = await request.json().catch(() => ({}));
  const referenceId = typeof body.referenceId === "string" ? body.referenceId : "";
  const displayName = typeof body.displayName === "string" ? body.displayName.trim() : "";
  const type = projectReferenceTypeSchema.safeParse(body.type);
  const description = typeof body.description === "string" && body.description.trim() ? body.description.trim() : null;
  if (!referenceId || !displayName || displayName.length > 120 || !type.success || (description && description.length > 500)) return response("VALIDATION_ERROR", "Provide a reference name, category, and an optional description up to 500 characters.", 400);
  const reference = repositories().updateProjectReference(projectId, referenceId, { displayName, type: type.data, description });
  return reference ? NextResponse.json({ reference }) : response("NOT_FOUND", "Reference not found.", 404);
}

function parseForm(form: FormData | undefined): { ok: true; value: { file: File; displayName: string; type: "Character" | "Environment" | "Prop" | "Style"; description: string | null; replaceId: string | null } } | { ok: false; message: string } {
  const file = form?.get("file"); const displayName = typeof form?.get("displayName") === "string" ? String(form!.get("displayName")).trim() : "";
  const type = projectReferenceTypeSchema.safeParse(form?.get("type")); const descriptionValue = form?.get("description"); const replaceId = typeof form?.get("replaceId") === "string" ? String(form!.get("replaceId")) : null;
  if (!(file instanceof File) || file.size === 0 || file.size > 15 * 1024 * 1024 || !allowedExtensions.has(path.extname(file.name).toLowerCase()) || (file.type && !allowedTypes.has(file.type))) return { ok: false, message: "Upload a JPG, JPEG, PNG, or WebP image up to 15 MB." };
  if (!displayName || displayName.length > 120 || !type.success || (typeof descriptionValue === "string" && descriptionValue.length > 500)) return { ok: false, message: "Provide a reference name, type, and an optional description up to 500 characters." };
  return { ok: true, value: { file, displayName, type: type.data, description: typeof descriptionValue === "string" && descriptionValue.trim() ? descriptionValue.trim() : null, replaceId } };
}

function response(code: string, message: string, status: number) { return NextResponse.json({ error: { code, message } }, { status }); }
