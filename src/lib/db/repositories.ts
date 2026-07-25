import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import type { CreateProjectInput, ProjectStatus, SceneStatus, UpdateProjectInput, VersionStatus } from "@/lib/domain/contracts";

type ProjectRow = {
  id: string; title: string; synopsis: string; genre: string; language_code: string;
  status: ProjectStatus; created_at: string; updated_at: string;
};
type SceneRow = {
  id: string; project_id: string; scene_number: number; exact_text: string; status: SceneStatus;
  approved_version_id: string | null; created_at: string; updated_at: string;
};
type VersionRow = {
  id: string; scene_id: string; version_number: number; provider: string; status: VersionStatus;
  video_path: string | null; created_at: string; updated_at: string;
};

export type Project = { id: string; title: string; synopsis: string; genre: string; languageCode: string; status: ProjectStatus; createdAt: string; updatedAt: string };
export type ProjectListItem = Pick<Project, "id" | "title" | "status" | "updatedAt"> & { approvedScenes: number; totalScenes: number };
export type Scene = { id: string; projectId: string; sceneNumber: number; exactText: string; status: SceneStatus; approvedVersionId: string | null; createdAt: string; updatedAt: string };
export type SceneVersion = { id: string; sceneId: string; versionNumber: number; provider: string; status: VersionStatus; videoPath: string | null; createdAt: string; updatedAt: string };

const projectFromRow = (row: ProjectRow): Project => ({ id: row.id, title: row.title, synopsis: row.synopsis, genre: row.genre, languageCode: row.language_code, status: row.status, createdAt: row.created_at, updatedAt: row.updated_at });
const sceneFromRow = (row: SceneRow): Scene => ({ id: row.id, projectId: row.project_id, sceneNumber: row.scene_number, exactText: row.exact_text, status: row.status, approvedVersionId: row.approved_version_id, createdAt: row.created_at, updatedAt: row.updated_at });
const versionFromRow = (row: VersionRow): SceneVersion => ({ id: row.id, sceneId: row.scene_id, versionNumber: row.version_number, provider: row.provider, status: row.status, videoPath: row.video_path, createdAt: row.created_at, updatedAt: row.updated_at });

export function createRepositories(database: Database.Database) {
  return {
    createProject(input: CreateProjectInput): Project {
      const now = new Date().toISOString();
      const project: Project = { id: randomUUID(), ...input, status: "DRAFT", createdAt: now, updatedAt: now };
      database.prepare(`INSERT INTO projects (id, title, synopsis, genre, language_code, status, created_at, updated_at)
        VALUES (@id, @title, @synopsis, @genre, @languageCode, @status, @createdAt, @updatedAt)`).run(project);
      return project;
    },
    listProjects(): ProjectListItem[] {
      const rows = database.prepare(`SELECT p.id, p.title, p.status, p.updated_at,
        COUNT(s.id) AS total_scenes, SUM(CASE WHEN s.approved_version_id IS NOT NULL THEN 1 ELSE 0 END) AS approved_scenes
        FROM projects p LEFT JOIN scenes s ON s.project_id = p.id GROUP BY p.id ORDER BY p.updated_at DESC`).all() as Array<{ id: string; title: string; status: ProjectStatus; updated_at: string; total_scenes: number; approved_scenes: number | null }>;
      return rows.map((row) => ({ id: row.id, title: row.title, status: row.status, updatedAt: row.updated_at, totalScenes: row.total_scenes, approvedScenes: row.approved_scenes ?? 0 }));
    },
    getProject(id: string): Project | undefined {
      const row = database.prepare("SELECT * FROM projects WHERE id = ?").get(id) as ProjectRow | undefined;
      return row && projectFromRow(row);
    },
    updateProject(id: string, input: UpdateProjectInput): Project | undefined {
      const existing = this.getProject(id);
      if (!existing) return undefined;
      const updated = { ...existing, ...input, updatedAt: new Date().toISOString() };
      database.prepare(`UPDATE projects SET title = @title, synopsis = @synopsis, genre = @genre, language_code = @languageCode,
        status = @status, updated_at = @updatedAt WHERE id = @id`).run(updated);
      return updated;
    },
    createScene(projectId: string, input: Pick<Scene, "sceneNumber" | "exactText">): Scene {
      const now = new Date().toISOString();
      const scene: Scene = { id: randomUUID(), projectId, ...input, status: "DRAFT", approvedVersionId: null, createdAt: now, updatedAt: now };
      database.prepare(`INSERT INTO scenes (id, project_id, scene_number, exact_text, status, created_at, updated_at)
        VALUES (@id, @projectId, @sceneNumber, @exactText, @status, @createdAt, @updatedAt)`).run(scene);
      return scene;
    },
    listScenes(projectId: string): Scene[] {
      return (database.prepare("SELECT * FROM scenes WHERE project_id = ? ORDER BY scene_number").all(projectId) as SceneRow[]).map(sceneFromRow);
    },
    createSceneVersion(sceneId: string, provider: string): SceneVersion {
      const next = database.prepare("SELECT COALESCE(MAX(version_number), 0) + 1 AS version_number FROM scene_versions WHERE scene_id = ?").get(sceneId) as { version_number: number };
      const now = new Date().toISOString();
      const version: SceneVersion = { id: randomUUID(), sceneId, versionNumber: next.version_number, provider, status: "QUEUED", videoPath: null, createdAt: now, updatedAt: now };
      database.prepare(`INSERT INTO scene_versions (id, scene_id, version_number, provider, status, created_at, updated_at)
        VALUES (@id, @sceneId, @versionNumber, @provider, @status, @createdAt, @updatedAt)`).run(version);
      return version;
    },
    listSceneVersions(sceneId: string): SceneVersion[] {
      return (database.prepare("SELECT * FROM scene_versions WHERE scene_id = ? ORDER BY version_number").all(sceneId) as VersionRow[]).map(versionFromRow);
    },
  };
}
