import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import type { CreateProjectInput, PlannedScene, ProductionBible, ProjectStatus, SceneStatus, UpdateProjectInput, VersionStatus, VoiceBible } from "@/lib/domain/contracts";

type ProjectRow = {
  id: string; title: string; synopsis: string; genre: string; language_code: string;
  status: ProjectStatus; story_bible_json: string | null; visual_bible_json: string | null; voice_bible_json: string | null; created_at: string; updated_at: string;
};
type SceneRow = {
  id: string; project_id: string; scene_number: number; exact_text: string; status: SceneStatus;
  emotion: string | null; mood: string | null; camera_intent: string | null; estimated_duration_seconds: number | null; prompt_notes: string | null;
  intensity: number | null; pace: string | null; energy: string | null; ending_style: string | null; delivery_prompt: string | null;
  approved_version_id: string | null; created_at: string; updated_at: string;
};
type AudioVersionRow = { id: string; scene_id: string; version_number: number; provider: string; model: string; audio_path: string; duration_ms: number; status: "READY" | "APPROVED"; created_at: string; approved_at: string | null };
type VersionRow = {
  id: string; scene_id: string; version_number: number; provider: string; status: VersionStatus;
  prompt: string | null; negative_prompt: string | null; provider_job_id: string | null; video_path: string | null; duration_ms: number | null; error_message: string | null; created_at: string; updated_at: string;
};

export type Project = { id: string; title: string; synopsis: string; genre: string; languageCode: string; status: ProjectStatus; productionBible: ProductionBible | null; voiceBible: VoiceBible | null; createdAt: string; updatedAt: string };
export type ProjectListItem = Pick<Project, "id" | "title" | "status" | "updatedAt"> & { approvedScenes: number; totalScenes: number };
export type Scene = { id: string; projectId: string; sceneNumber: number; exactText: string; status: SceneStatus; emotion: string | null; mood: string | null; cameraIntent: string | null; estimatedDurationSeconds: number | null; promptNotes: string | null; intensity: number | null; pace: string | null; energy: string | null; endingStyle: string | null; deliveryPrompt: string | null; ttsPath: string | null; ttsDurationMs: number | null; targetVideoDurationMs: number | null; approvedVersionId: string | null; negativePrompt: string | null; createdAt: string; updatedAt: string };
export type SceneVersion = { id: string; sceneId: string; versionNumber: number; provider: string; status: VersionStatus; prompt: string | null; negativePrompt: string | null; providerJobId: string | null; videoPath: string | null; durationMs: number | null; errorMessage: string | null; createdAt: string; updatedAt: string };
export type AudioVersion = { id: string; sceneId: string; versionNumber: number; provider: string; model: string; audioPath: string; durationMs: number; status: "READY" | "APPROVED"; createdAt: string; approvedAt: string | null };

const projectFromRow = (row: ProjectRow): Project => ({ id: row.id, title: row.title, synopsis: row.synopsis, genre: row.genre, languageCode: row.language_code, status: row.status, productionBible: row.story_bible_json ? JSON.parse(row.story_bible_json) as ProductionBible : null, voiceBible: row.voice_bible_json ? JSON.parse(row.voice_bible_json) as VoiceBible : null, createdAt: row.created_at, updatedAt: row.updated_at });
const sceneFromRow = (row: SceneRow): Scene => ({ id: row.id, projectId: row.project_id, sceneNumber: row.scene_number, exactText: row.exact_text, status: row.status, emotion: row.emotion, mood: row.mood, cameraIntent: row.camera_intent, estimatedDurationSeconds: row.estimated_duration_seconds, promptNotes: row.prompt_notes, intensity: row.intensity, pace: row.pace, energy: row.energy, endingStyle: row.ending_style, deliveryPrompt: row.delivery_prompt, ttsPath: (row as SceneRow & { tts_path: string | null }).tts_path, ttsDurationMs: (row as SceneRow & { tts_duration_ms: number | null }).tts_duration_ms, targetVideoDurationMs: (row as SceneRow & { target_video_duration_ms: number | null }).target_video_duration_ms, approvedVersionId: row.approved_version_id, negativePrompt: (row as SceneRow & { negative_prompt: string | null }).negative_prompt, createdAt: row.created_at, updatedAt: row.updated_at });
const versionFromRow = (row: VersionRow): SceneVersion => ({ id: row.id, sceneId: row.scene_id, versionNumber: row.version_number, provider: row.provider, status: row.status, prompt: row.prompt, negativePrompt: row.negative_prompt, providerJobId: row.provider_job_id, videoPath: row.video_path, durationMs: row.duration_ms, errorMessage: row.error_message, createdAt: row.created_at, updatedAt: row.updated_at });
const audioVersionFromRow = (row: AudioVersionRow): AudioVersion => ({ id: row.id, sceneId: row.scene_id, versionNumber: row.version_number, provider: row.provider, model: row.model, audioPath: row.audio_path, durationMs: row.duration_ms, status: row.status, createdAt: row.created_at, approvedAt: row.approved_at });

export function createRepositories(database: Database.Database) {
  return {
    createProject(input: CreateProjectInput): Project {
      const now = new Date().toISOString();
      const project: Project = { id: randomUUID(), ...input, status: "DRAFT", productionBible: null, voiceBible: null, createdAt: now, updatedAt: now };
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
      const scene: Scene = { id: randomUUID(), projectId, ...input, status: "DRAFT", emotion: null, mood: null, cameraIntent: null, estimatedDurationSeconds: null, promptNotes: null, intensity: null, pace: null, energy: null, endingStyle: null, deliveryPrompt: null, ttsPath: null, ttsDurationMs: null, targetVideoDurationMs: null, approvedVersionId: null, negativePrompt: null, createdAt: now, updatedAt: now };
      database.prepare(`INSERT INTO scenes (id, project_id, scene_number, exact_text, status, created_at, updated_at)
        VALUES (@id, @projectId, @sceneNumber, @exactText, @status, @createdAt, @updatedAt)`).run(scene);
      return scene;
    },
    listScenes(projectId: string): Scene[] {
      return (database.prepare("SELECT * FROM scenes WHERE project_id = ? ORDER BY scene_number").all(projectId) as SceneRow[]).map(sceneFromRow);
    },
    replacePlanning(projectId: string, productionBible: ProductionBible, voiceBible: VoiceBible, scenes: PlannedScene[]): Project | undefined {
      const project = this.getProject(projectId);
      if (!project) return undefined;
      const now = new Date().toISOString();
      database.transaction(() => {
        database.prepare("DELETE FROM scenes WHERE project_id = ?").run(projectId);
        database.prepare("UPDATE projects SET story_bible_json = ?, voice_bible_json = ?, status = 'BIBLE_READY', updated_at = ? WHERE id = ?")
          .run(JSON.stringify(productionBible), JSON.stringify(voiceBible), now, projectId);
        const insert = database.prepare(`INSERT INTO scenes (id, project_id, scene_number, exact_text, status, emotion, mood, camera_intent, estimated_duration_seconds, prompt_notes, intensity, pace, energy, ending_style, delivery_prompt, created_at, updated_at)
          VALUES (@id, @projectId, @sceneNumber, @exactText, 'DRAFT', @emotion, @mood, @cameraIntent, @estimatedDurationSeconds, @promptNotes, @intensity, @pace, @energy, @endingStyle, @deliveryPrompt, @createdAt, @updatedAt)`);
        for (const planned of scenes) insert.run({ id: randomUUID(), projectId, ...planned, createdAt: now, updatedAt: now });
      })();
      return this.getProject(projectId);
    },
    approveProductionBible(projectId: string): Project | undefined {
      const project = this.getProject(projectId);
      if (!project || !project.productionBible) return undefined;
      database.prepare("UPDATE projects SET status = 'VOICE_REVIEW', updated_at = ? WHERE id = ?")
        .run(new Date().toISOString(), projectId);
      return this.getProject(projectId);
    },
    getScene(sceneId: string): Scene | undefined {
      const row = database.prepare("SELECT * FROM scenes WHERE id = ?").get(sceneId) as SceneRow | undefined;
      return row && sceneFromRow(row);
    },
    updateSceneDeliveryPrompt(sceneId: string, deliveryPrompt: string): Scene | undefined {
      const scene = this.getScene(sceneId); if (!scene) return undefined;
      database.prepare("UPDATE scenes SET delivery_prompt = ?, updated_at = ? WHERE id = ?").run(deliveryPrompt, new Date().toISOString(), sceneId);
      return this.getScene(sceneId);
    },
    createAudioVersion(input: Omit<AudioVersion, "id" | "versionNumber" | "createdAt" | "approvedAt" | "status">): AudioVersion {
      const next = database.prepare("SELECT COALESCE(MAX(version_number), 0) + 1 AS version_number FROM audio_versions WHERE scene_id = ?").get(input.sceneId) as { version_number: number };
      const now = new Date().toISOString(); const version: AudioVersion = { id: randomUUID(), ...input, versionNumber: next.version_number, status: "READY", createdAt: now, approvedAt: null };
      database.prepare(`INSERT INTO audio_versions (id, scene_id, version_number, provider, model, audio_path, duration_ms, status, created_at)
        VALUES (@id, @sceneId, @versionNumber, @provider, @model, @audioPath, @durationMs, @status, @createdAt)`).run(version);
      database.prepare("UPDATE scenes SET tts_path = ?, tts_duration_ms = ?, target_video_duration_ms = ?, status = 'TTS_READY', updated_at = ? WHERE id = ?")
        .run(version.audioPath, version.durationMs, version.durationMs + 1200, now, input.sceneId);
      return version;
    },
    listAudioVersions(sceneId: string): AudioVersion[] {
      return (database.prepare("SELECT * FROM audio_versions WHERE scene_id = ? ORDER BY version_number").all(sceneId) as AudioVersionRow[]).map(audioVersionFromRow);
    },
    getAudioVersion(audioVersionId: string): AudioVersion | undefined {
      const row = database.prepare("SELECT * FROM audio_versions WHERE id = ?").get(audioVersionId) as AudioVersionRow | undefined;
      return row && audioVersionFromRow(row);
    },
    approveTts(sceneId: string): Scene | undefined {
      const latest = database.prepare("SELECT * FROM audio_versions WHERE scene_id = ? ORDER BY version_number DESC LIMIT 1").get(sceneId) as AudioVersionRow | undefined;
      if (!latest) return undefined;
      const now = new Date().toISOString();
      database.transaction(() => {
        database.prepare("UPDATE audio_versions SET status = 'READY', approved_at = NULL WHERE scene_id = ?").run(sceneId);
        database.prepare("UPDATE audio_versions SET status = 'APPROVED', approved_at = ? WHERE id = ?").run(now, latest.id);
        database.prepare("UPDATE scenes SET tts_path = ?, tts_duration_ms = ?, target_video_duration_ms = ?, status = 'TTS_APPROVED', updated_at = ? WHERE id = ?")
          .run(latest.audio_path, latest.duration_ms, latest.duration_ms + 1200, now, sceneId);
      })();
      const scene = this.getScene(sceneId); if (!scene) return undefined;
      const remaining = database.prepare("SELECT COUNT(*) AS count FROM scenes WHERE project_id = ? AND status != 'TTS_APPROVED'").get(scene.projectId) as { count: number };
      if (Number(remaining.count) === 0) database.prepare("UPDATE projects SET status = 'SHOT_GENERATION', updated_at = ? WHERE id = ?").run(now, scene.projectId);
      return this.getScene(sceneId);
    },
    createSceneVersion(input: { sceneId: string; provider: string; prompt: string; negativePrompt: string; providerJobId?: string; videoPath?: string; durationMs?: number; status?: VersionStatus }): SceneVersion {
      const { sceneId } = input;
      const next = database.prepare("SELECT COALESCE(MAX(version_number), 0) + 1 AS version_number FROM scene_versions WHERE scene_id = ?").get(sceneId) as { version_number: number };
      const now = new Date().toISOString();
      const version: SceneVersion = { id: randomUUID(), sceneId, versionNumber: next.version_number, provider: input.provider, status: input.status ?? "QUEUED", prompt: input.prompt, negativePrompt: input.negativePrompt, providerJobId: input.providerJobId ?? null, videoPath: input.videoPath ?? null, durationMs: input.durationMs ?? null, errorMessage: null, createdAt: now, updatedAt: now };
      database.transaction(() => {
        database.prepare(`INSERT INTO scene_versions (id, scene_id, version_number, provider, provider_job_id, status, prompt, negative_prompt, video_path, duration_ms, created_at, updated_at)
          VALUES (@id, @sceneId, @versionNumber, @provider, @providerJobId, @status, @prompt, @negativePrompt, @videoPath, @durationMs, @createdAt, @updatedAt)`).run(version);
        database.prepare("UPDATE scenes SET status = ?, video_prompt = ?, negative_prompt = ?, updated_at = ? WHERE id = ?").run(version.status === "READY" ? "VIDEO_REVIEW" : "VIDEO_QUEUED", input.prompt, input.negativePrompt, now, sceneId);
      })();
      return version;
    },
    listSceneVersions(sceneId: string): SceneVersion[] {
      return (database.prepare("SELECT * FROM scene_versions WHERE scene_id = ? ORDER BY version_number").all(sceneId) as VersionRow[]).map(versionFromRow);
    },
    getSceneVersion(versionId: string): SceneVersion | undefined {
      const row = database.prepare("SELECT * FROM scene_versions WHERE id = ?").get(versionId) as VersionRow | undefined;
      return row && versionFromRow(row);
    },
    countProviderVersions(sceneId: string): number {
      return (database.prepare("SELECT COUNT(*) AS count FROM scene_versions WHERE scene_id = ? AND provider != 'manual'").get(sceneId) as { count: number }).count;
    },
    updateSceneVersion(versionId: string, input: Partial<Pick<SceneVersion, "status" | "providerJobId" | "videoPath" | "durationMs" | "errorMessage">>): SceneVersion | undefined {
      const version = this.getSceneVersion(versionId); if (!version) return undefined;
      const updated = { ...version, ...input, updatedAt: new Date().toISOString() };
      database.transaction(() => {
        database.prepare("UPDATE scene_versions SET status = @status, provider_job_id = @providerJobId, video_path = @videoPath, duration_ms = @durationMs, error_message = @errorMessage, updated_at = @updatedAt WHERE id = @id").run(updated);
        if (updated.status === "READY") database.prepare("UPDATE scenes SET status = 'VIDEO_REVIEW', updated_at = ? WHERE id = ?").run(updated.updatedAt, updated.sceneId);
        if (updated.status === "READY") database.prepare("UPDATE projects SET status = 'SHOT_REVIEW', updated_at = ? WHERE id = (SELECT project_id FROM scenes WHERE id = ?)").run(updated.updatedAt, updated.sceneId);
      })();
      return this.getSceneVersion(versionId);
    },
    approveSceneVersion(versionId: string): SceneVersion | undefined {
      const version = this.getSceneVersion(versionId); if (!version || (version.status !== "READY" && version.status !== "APPROVED")) return undefined;
      const now = new Date().toISOString();
      database.transaction(() => {
        database.prepare("UPDATE scene_versions SET status = 'READY', updated_at = ? WHERE scene_id = ? AND status = 'APPROVED'").run(now, version.sceneId);
        database.prepare("UPDATE scene_versions SET status = 'APPROVED', updated_at = ? WHERE id = ?").run(now, versionId);
        database.prepare("UPDATE scenes SET approved_version_id = ?, status = 'APPROVED', updated_at = ? WHERE id = ?").run(versionId, now, version.sceneId);
        const scene = this.getScene(version.sceneId)!;
        const remaining = database.prepare("SELECT COUNT(*) AS count FROM scenes WHERE project_id = ? AND approved_version_id IS NULL").get(scene.projectId) as { count: number };
        database.prepare("UPDATE projects SET status = ?, updated_at = ? WHERE id = ?").run(remaining.count === 0 ? "READY_TO_RENDER" : "SHOT_REVIEW", now, scene.projectId);
      })();
      return this.getSceneVersion(versionId);
    },
    rejectSceneVersion(versionId: string, reason?: string): SceneVersion | undefined {
      const version = this.getSceneVersion(versionId); if (!version || version.status === "APPROVED") return undefined;
      const now = new Date().toISOString();
      database.transaction(() => {
        database.prepare("UPDATE scene_versions SET status = 'REJECTED', error_message = ?, updated_at = ? WHERE id = ?").run(reason ?? null, now, versionId);
        database.prepare("UPDATE scenes SET status = 'VIDEO_REVIEW', updated_at = ? WHERE id = ?").run(now, version.sceneId);
      })();
      return this.getSceneVersion(versionId);
    },
  };
}
