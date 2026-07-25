import fs from "node:fs"; import path from "node:path";
import { createProjectSchema } from "../src/lib/domain/contracts"; import { repositories } from "../src/lib/db";
const value = JSON.parse(fs.readFileSync(path.join(process.cwd(), "seed", "demo-project.json"), "utf8")) as { scenes: string[] };
const input = createProjectSchema.parse(value); const repo = repositories(); const existing = repo.listProjects().find((project) => project.title === input.title);
if (existing) console.log(`Demo project already exists: ${existing.id}`);
else { const project = repo.createProject(input); value.scenes.forEach((exactText, index) => repo.createScene(project.id, { sceneNumber: index + 1, exactText })); console.log(`Seeded demo project: ${project.id}`); }
