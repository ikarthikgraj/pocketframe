import { NextResponse } from "next/server";
import { repositories } from "@/lib/db";
export const runtime = "nodejs";
type Context = { params: Promise<{ projectId: string }> };
export async function GET(_: Request, { params }: Context) { const projectId = (await params).projectId; const repo = repositories(); if (!repo.getProject(projectId)) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 }); const readiness = repo.getRenderReadiness(projectId); const render = repo.getLatestRenderVersion(projectId); return NextResponse.json({ status: render?.status ?? (readiness.ready ? "READY" : "NOT_READY"), readiness, render, finalRenderPath: render?.outputPath ?? null, durationMs: render?.durationMs ?? null }); }
