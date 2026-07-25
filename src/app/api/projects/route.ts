import { NextResponse } from "next/server";
import { createProjectSchema } from "@/lib/domain/contracts";
import { repositories } from "@/lib/db";

export const runtime = "nodejs";

export function GET() { return NextResponse.json({ projects: repositories().listProjects() }); }

export async function POST(request: Request) {
  const body = await request.json().catch(() => undefined);
  const result = createProjectSchema.safeParse(body);
  if (!result.success) return NextResponse.json({ error: { code: "VALIDATION_ERROR", message: "Provide a title, synopsis, genre, and language.", details: result.error.flatten() } }, { status: 400 });
  const project = repositories().createProject(result.data);
  return NextResponse.json({ project }, { status: 201 });
}
