import fs from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { getConfig } from "@/lib/config";
import { repositories } from "@/lib/db";
export const runtime = "nodejs";
type Context = { params: Promise<{ renderId: string }> };
export async function GET(_: Request, { params }: Context) { const renderId = (await params).renderId; const render = [...repositories().listProjects()].flatMap((project) => repositories().listRenderVersions(project.id)).find((item) => item.id === renderId); if (!render?.outputPath || render.outputPath.includes("..")) return NextResponse.json({ error: { code: "RENDER_NOT_READY", message: "Final trailer is unavailable." } }, { status: 404 }); try { return new NextResponse(await fs.readFile(path.join(getConfig().dataDirectory, render.outputPath)), { headers: { "Content-Type": "video/mp4", "Cache-Control": "no-store" } }); } catch { return NextResponse.json({ error: { code: "RENDER_FILE_NOT_FOUND", message: "Final trailer file is unavailable." } }, { status: 404 }); } }
