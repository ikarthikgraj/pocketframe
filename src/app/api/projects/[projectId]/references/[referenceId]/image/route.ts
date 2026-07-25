import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { repositories } from "@/lib/db";
import { getConfig } from "@/lib/config";

export const runtime = "nodejs";
type Context = { params: Promise<{ projectId: string; referenceId: string }> };

export async function GET(_: Request, { params }: Context) {
  const { projectId, referenceId } = await params;
  const reference = repositories().getProject(projectId)?.references.find((item) => item.id === referenceId && item.active);
  if (!reference) return new NextResponse("Not found", { status: 404 });
  try {
    const bytes = await fs.readFile(path.join(getConfig().dataDirectory, reference.localPath));
    const extension = path.extname(reference.localPath).toLowerCase();
    return new NextResponse(bytes, { headers: { "Content-Type": extension === ".png" ? "image/png" : extension === ".webp" ? "image/webp" : "image/jpeg", "Cache-Control": "private, max-age=3600" } });
  } catch { return new NextResponse("Not found", { status: 404 }); }
}
