import { randomUUID } from "node:crypto";
import Database from "better-sqlite3";
import type { CreateProjectInput, PlannedScene, ProductionBible, ProjectReferenceType, ProjectStatus, SceneStatus, UpdateProjectInput, VersionStatus, VoiceBible } from "@/lib/domain/contracts";
import { normalizeVideoDuration } from "@/lib/video/duration";
import { narrationScriptHash } from "@/lib/narration";
import { isNovaProject, seedNovaProject } from "@/lib/nova";

type ProjectRow = {
  id: string; title: string; synopsis: string; genre: string; language_code: string;
  status: ProjectStatus; references_json: string | null; story_bible_json: string | null; visual_bible_json: string | null; voice_bible_json: string | null; created_at: string; updated_at: string;
};
type SceneRow = {
  id: string; project_id: string; scene_number: number; exact_text: string; status: SceneStatus;
  emotion: string | null; mood: string | null; camera_intent: string | null; estimated_duration_seconds: number | null; prompt_notes: string | null;
  intensity: number | null; pace: string | null; energy: string | null; ending_style: string | null; delivery_prompt: string | null;
  approved_version_id: string | null; selected_reference_ids_json: string | null; video_duration_seconds: number | null; created_at: string; updated_at: string;
  original_narration_text: string | null; current_narration_text: string | null; narration_revision: number | null; narration_updated_at: string | null; narration_script_hash: string | null; selected_audio_version_id: string | null;
};
type AudioVersionRow = { id: string; scene_id: string; version_number: number; provider: string; model: string; audio_path: string; duration_ms: number; status: "READY" | "SELECTED" | "APPROVED" | "REJECTED"; created_at: string; approved_at: string | null; script_hash: string | null; narration_revision: number | null; selected_at: string | null };
type VersionRow = {
  id: string; scene_id: string; version_number: number; provider: string; status: VersionStatus;
  prompt: string | null; negative_prompt: string | null; provider_job_id: string | null; video_path: string | null; duration_ms: number | null; error_message: string | null; video_model: string | null; created_at: string; updated_at: string;
};

export type ProjectReference = { id: string; projectId: string; displayName: string; type: ProjectReferenceType; localPath: string; description: string | null; uploadedAt: string; source: "user-uploaded"; active: boolean };
export type Project = { id: string; title: string; synopsis: string; genre: string; languageCode: string; status: ProjectStatus; references: ProjectReference[]; productionBible: ProductionBible | null; voiceBible: VoiceBible | null; createdAt: string; updatedAt: string };
export type ProjectListItem = Pick<Project, "id" | "title" | "genre" | "languageCode" | "status" | "updatedAt"> & { approvedScenes: number; totalScenes: number };
export type Scene = { id: string; projectId: string; sceneNumber: number; exactText: string; originalNarrationText: string; currentNarrationText: string; narrationRevision: number; narrationUpdatedAt: string | null; narrationScriptHash: string; selectedAudioVersionId: string | null; status: SceneStatus; emotion: string | null; mood: string | null; cameraIntent: string | null; estimatedDurationSeconds: number | null; promptNotes: string | null; intensity: number | null; pace: string | null; energy: string | null; endingStyle: string | null; deliveryPrompt: string | null; ttsPath: string | null; ttsDurationMs: number | null; targetVideoDurationMs: number | null; videoDurationSeconds: number | null; selectedReferenceIds: string[]; approvedVersionId: string | null; negativePrompt: string | null; createdAt: string; updatedAt: string };
export type SceneVersion = { id: string; sceneId: string; versionNumber: number; provider: string; model: string | null; status: VersionStatus; prompt: string | null; negativePrompt: string | null; providerJobId: string | null; videoPath: string | null; durationMs: number | null; errorMessage: string | null; createdAt: string; updatedAt: string };
export type AudioVersion = { id: string; sceneId: string; versionNumber: number; provider: string; model: string; audioPath: string; durationMs: number; status: "READY" | "SELECTED" | "APPROVED" | "REJECTED"; scriptHash: string; narrationRevision: number; selectedAt: string | null; createdAt: string; approvedAt: string | null };
export type RenderStatus = "NOT_READY" | "READY" | "RENDERING" | "COMPLETE" | "FAILED";
export type RenderVersion = { id: string; projectId: string; versionNumber: number; status: RenderStatus; currentStage: number | null; startedAt: string | null; completedAt: string | null; outputPath: string | null; durationMs: number | null; errorMessage: string | null; musicPath: string | null; createdAt: string };
type RenderRow = { id: string; project_id: string; version_number: number; status: RenderStatus; current_stage: number | null; started_at: string | null; completed_at: string | null; output_path: string | null; duration_ms: number | null; error_message: string | null; music_path: string | null; created_at: string };

const parseReferences = (value: string | null, projectId: string): ProjectReference[] => { try { const parsed = JSON.parse(value ?? "[]"); return Array.isArray(parsed) ? parsed.filter((reference): reference is ProjectReference => Boolean(reference?.id && reference?.displayName && reference?.localPath)).map((reference) => ({ ...reference, projectId, source: "user-uploaded", active: reference.active !== false })) : []; } catch { return []; } };
const parseReferenceIds = (value: string | null) => { try { const parsed = JSON.parse(value ?? "[]"); return Array.isArray(parsed) ? parsed.filter((id): id is string => typeof id === "string") : []; } catch { return []; } };
const projectFromRow = (row: ProjectRow): Project => ({ id: row.id, title: row.title, synopsis: row.synopsis, genre: row.genre, languageCode: row.language_code, status: row.status, references: parseReferences(row.references_json, row.id), productionBible: row.story_bible_json ? JSON.parse(row.story_bible_json) as ProductionBible : null, voiceBible: row.voice_bible_json ? JSON.parse(row.voice_bible_json) as VoiceBible : null, createdAt: row.created_at, updatedAt: row.updated_at });
const sceneFromRow = (row: SceneRow): Scene => {
  const originalNarrationText = row.original_narration_text ?? row.exact_text;
  const currentNarrationText = row.current_narration_text ?? originalNarrationText;
  return { id: row.id, projectId: row.project_id, sceneNumber: row.scene_number, exactText: row.exact_text, originalNarrationText, currentNarrationText, narrationRevision: row.narration_revision ?? 0, narrationUpdatedAt: row.narration_updated_at, narrationScriptHash: row.narration_script_hash ?? narrationScriptHash(currentNarrationText), selectedAudioVersionId: row.selected_audio_version_id, status: row.status, emotion: row.emotion, mood: row.mood, cameraIntent: row.camera_intent, estimatedDurationSeconds: row.estimated_duration_seconds, promptNotes: row.prompt_notes, intensity: row.intensity, pace: row.pace, energy: row.energy, endingStyle: row.ending_style, deliveryPrompt: row.delivery_prompt, ttsPath: (row as SceneRow & { tts_path: string | null }).tts_path, ttsDurationMs: (row as SceneRow & { tts_duration_ms: number | null }).tts_duration_ms, targetVideoDurationMs: (row as SceneRow & { target_video_duration_ms: number | null }).target_video_duration_ms, videoDurationSeconds: row.video_duration_seconds === null || row.video_duration_seconds === undefined ? null : normalizeVideoDuration(row.video_duration_seconds), selectedReferenceIds: parseReferenceIds(row.selected_reference_ids_json), approvedVersionId: row.approved_version_id, negativePrompt: (row as SceneRow & { negative_prompt: string | null }).negative_prompt, createdAt: row.created_at, updatedAt: row.updated_at };
};
const versionFromRow = (row: VersionRow): SceneVersion => ({ id: row.id, sceneId: row.scene_id, versionNumber: row.version_number, provider: row.provider, model: row.video_model, status: row.status, prompt: row.prompt, negativePrompt: row.negative_prompt, providerJobId: row.provider_job_id, videoPath: row.video_path, durationMs: row.duration_ms, errorMessage: row.error_message, createdAt: row.created_at, updatedAt: row.updated_at });
const audioVersionFromRow = (row: AudioVersionRow): AudioVersion => ({ id: row.id, sceneId: row.scene_id, versionNumber: row.version_number, provider: row.provider, model: row.model, audioPath: row.audio_path, durationMs: row.duration_ms, status: row.status, scriptHash: row.script_hash ?? "", narrationRevision: row.narration_revision ?? 0, selectedAt: row.selected_at, createdAt: row.created_at, approvedAt: row.approved_at });
const renderFromRow = (row: RenderRow): RenderVersion => ({ id: row.id, projectId: row.project_id, versionNumber: row.version_number, status: row.status, currentStage: row.current_stage, startedAt: row.started_at, completedAt: row.completed_at, outputPath: row.output_path, durationMs: row.duration_ms, errorMessage: row.error_message, musicPath: row.music_path, createdAt: row.created_at });

export function createRepositories(database: Database.Database) {
  return {
    createProject(input: CreateProjectInput): Project {
      const now = new Date().toISOString();
      const project: Project = { id: randomUUID(), ...input, status: "DRAFT", references: [], productionBible: null, voiceBible: null, createdAt: now, updatedAt: now };
      database.prepare(`INSERT INTO projects (id, title, synopsis, genre, language_code, status, created_at, updated_at)
        VALUES (@id, @title, @synopsis, @genre, @languageCode, @status, @createdAt, @updatedAt)`).run(project);
      if (isNovaProject(input.title, input.synopsis)) {
        seedNovaProject(this, project.id);
      }
      return this.getProject(project.id)!;
    },
    listProjects(): ProjectListItem[] {
      const rows = database.prepare(`SELECT p.id, p.title, p.genre, p.language_code, p.status, p.updated_at,
        COUNT(s.id) AS total_scenes, SUM(CASE WHEN s.approved_version_id IS NOT NULL THEN 1 ELSE 0 END) AS approved_scenes
        FROM projects p LEFT JOIN scenes s ON s.project_id = p.id GROUP BY p.id ORDER BY p.updated_at DESC`).all() as Array<{ id: string; title: string; genre: string; language_code: string; status: ProjectStatus; updated_at: string; total_scenes: number; approved_scenes: number | null }>;
      return rows.map((row) => ({ id: row.id, title: row.title, genre: row.genre, languageCode: row.language_code, status: row.status, updatedAt: row.updated_at, totalScenes: row.total_scenes, approvedScenes: row.approved_scenes ?? 0 }));
    },
    getProject(id: string): Project | undefined {
      const row = database.prepare("SELECT * FROM projects WHERE id = ?").get(id) as ProjectRow | undefined;
      return row && projectFromRow(row);
    },
    deleteProject(id: string): boolean {
      const result = database.prepare("DELETE FROM projects WHERE id = ?").run(id);
      return result.changes > 0;
    },
    addProjectReference(projectId: string, input: Omit<ProjectReference, "id" | "projectId" | "uploadedAt" | "source" | "active">): ProjectReference {
      const project = this.getProject(projectId);
      if (!project) throw new Error("Project not found.");
      if (project.references.length >= 3) throw new Error("REFERENCE_LIMIT: A project can have up to 3 visual references.");
      const reference: ProjectReference = { id: randomUUID(), projectId, ...input, description: input.description?.trim() || null, uploadedAt: new Date().toISOString(), source: "user-uploaded", active: true };
      const references = [...project.references, reference];
      database.prepare("UPDATE projects SET references_json = ?, updated_at = ? WHERE id = ?").run(JSON.stringify(references), reference.uploadedAt, projectId);
      return reference;
    },
    replaceProjectReference(projectId: string, referenceId: string, input: Omit<ProjectReference, "id" | "projectId" | "uploadedAt" | "source" | "active">): ProjectReference | undefined {
      const project = this.getProject(projectId);
      const existing = project?.references.find((reference) => reference.id === referenceId);
      if (!project || !existing) return undefined;
      const reference: ProjectReference = { ...existing, ...input, description: input.description?.trim() || null, uploadedAt: new Date().toISOString(), source: "user-uploaded", active: true };
      database.prepare("UPDATE projects SET references_json = ?, updated_at = ? WHERE id = ?").run(JSON.stringify(project.references.map((item) => item.id === referenceId ? reference : item)), reference.uploadedAt, projectId);
      return reference;
    },
    updateProjectReference(projectId: string, referenceId: string, input: Pick<ProjectReference, "displayName" | "type" | "description">): ProjectReference | undefined {
      const project = this.getProject(projectId); const existing = project?.references.find((reference) => reference.id === referenceId);
      if (!project || !existing) return undefined;
      return this.replaceProjectReference(projectId, referenceId, { ...input, localPath: existing.localPath });
    },
    removeProjectReference(projectId: string, referenceId: string): ProjectReference | undefined {
      const project = this.getProject(projectId);
      const reference = project?.references.find((item) => item.id === referenceId);
      if (!project || !reference) return undefined;
      const now = new Date().toISOString();
      database.transaction(() => {
        database.prepare("UPDATE projects SET references_json = ?, updated_at = ? WHERE id = ?").run(JSON.stringify(project.references.filter((item) => item.id !== referenceId)), now, projectId);
        const scenes = this.listScenes(projectId);
        for (const scene of scenes) {
          if (scene.selectedReferenceIds.includes(referenceId)) database.prepare("UPDATE scenes SET selected_reference_ids_json = ?, updated_at = ? WHERE id = ?").run(JSON.stringify(scene.selectedReferenceIds.filter((id) => id !== referenceId)), now, scene.id);
        }
      })();
      return reference;
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
      const scene: Scene = { id: randomUUID(), projectId, ...input, originalNarrationText: input.exactText, currentNarrationText: input.exactText, narrationRevision: 0, narrationUpdatedAt: null, narrationScriptHash: narrationScriptHash(input.exactText), selectedAudioVersionId: null, status: "DRAFT", emotion: null, mood: null, cameraIntent: null, estimatedDurationSeconds: null, promptNotes: null, intensity: null, pace: null, energy: null, endingStyle: null, deliveryPrompt: null, ttsPath: null, ttsDurationMs: null, targetVideoDurationMs: null, videoDurationSeconds: null, selectedReferenceIds: [], approvedVersionId: null, negativePrompt: null, createdAt: now, updatedAt: now };
      database.prepare(`INSERT INTO scenes (id, project_id, scene_number, exact_text, original_narration_text, current_narration_text, narration_script_hash, status, created_at, updated_at)
        VALUES (@id, @projectId, @sceneNumber, @exactText, @originalNarrationText, @currentNarrationText, @narrationScriptHash, @status, @createdAt, @updatedAt)`).run(scene);
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
        const insert = database.prepare(`INSERT INTO scenes (id, project_id, scene_number, exact_text, original_narration_text, current_narration_text, narration_script_hash, status, emotion, mood, camera_intent, estimated_duration_seconds, prompt_notes, intensity, pace, energy, ending_style, delivery_prompt, created_at, updated_at)
          VALUES (@id, @projectId, @sceneNumber, @exactText, @originalNarrationText, @currentNarrationText, @narrationScriptHash, 'DRAFT', @emotion, @mood, @cameraIntent, @estimatedDurationSeconds, @promptNotes, @intensity, @pace, @energy, @endingStyle, @deliveryPrompt, @createdAt, @updatedAt)`);
        for (const planned of scenes) insert.run({ id: randomUUID(), projectId, ...planned, originalNarrationText: planned.exactText, currentNarrationText: planned.exactText, narrationScriptHash: narrationScriptHash(planned.exactText), createdAt: now, updatedAt: now });
      })();
      return this.getProject(projectId);
    },
    approveProductionBible(projectId: string): Project | undefined {
      const project = this.getProject(projectId);
      if (!project || !project.productionBible) return undefined;
      database.prepare("UPDATE projects SET status = 'SHOT_GENERATION', updated_at = ? WHERE id = ?")
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
    updateNarrationScript(sceneId: string, narration: string): Scene | undefined {
      const scene = this.getScene(sceneId); if (!scene) return undefined;
      const current = narration.trim(); const now = new Date().toISOString();
      const changed = current !== scene.currentNarrationText;
      database.prepare("UPDATE scenes SET current_narration_text = ?, narration_revision = ?, narration_updated_at = ?, narration_script_hash = ?, selected_audio_version_id = NULL, status = CASE WHEN status = 'APPROVED' THEN 'VIDEO_REVIEW' ELSE 'TTS_READY' END, updated_at = ? WHERE id = ?")
        .run(current, changed ? scene.narrationRevision + 1 : scene.narrationRevision, changed ? now : scene.narrationUpdatedAt, narrationScriptHash(current), now, sceneId);
      return this.getScene(sceneId);
    },
    setSceneReferenceIds(sceneId: string, referenceIds: string[]): Scene | undefined {
      const scene = this.getScene(sceneId); if (!scene) return undefined;
      const project = this.getProject(scene.projectId); if (!project) return undefined;
      const ids = [...new Set(referenceIds)];
      if (ids.length > 3 || ids.some((id) => !project.references.some((reference) => reference.id === id && reference.active))) throw new Error("INVALID_REFERENCES: Select only active references from this project.");
      database.prepare("UPDATE scenes SET selected_reference_ids_json = ?, updated_at = ? WHERE id = ?").run(JSON.stringify(ids), new Date().toISOString(), sceneId);
      return this.getScene(sceneId);
    },
    setSceneVideoDuration(sceneId: string, durationSeconds: number | null): Scene | undefined {
      const scene = this.getScene(sceneId); if (!scene) return undefined;
      const duration = durationSeconds === null ? null : normalizeVideoDuration(durationSeconds);
      database.prepare("UPDATE scenes SET video_duration_seconds = ?, updated_at = ? WHERE id = ?").run(duration, new Date().toISOString(), sceneId);
      return this.getScene(sceneId);
    },
    createAudioVersion(input: Omit<AudioVersion, "id" | "versionNumber" | "createdAt" | "approvedAt" | "status" | "scriptHash" | "narrationRevision" | "selectedAt">): AudioVersion {
      const next = database.prepare("SELECT COALESCE(MAX(version_number), 0) + 1 AS version_number FROM audio_versions WHERE scene_id = ?").get(input.sceneId) as { version_number: number };
      const scene = this.getScene(input.sceneId); if (!scene) throw new Error("Scene not found.");
      const now = new Date().toISOString(); const version: AudioVersion = { id: randomUUID(), ...input, versionNumber: next.version_number, status: "READY", scriptHash: scene.narrationScriptHash, narrationRevision: scene.narrationRevision, selectedAt: null, createdAt: now, approvedAt: null };
      database.prepare(`INSERT INTO audio_versions (id, scene_id, version_number, provider, model, audio_path, duration_ms, status, script_hash, narration_revision, created_at)
        VALUES (@id, @sceneId, @versionNumber, @provider, @model, @audioPath, @durationMs, @status, @scriptHash, @narrationRevision, @createdAt)`).run(version);
      database.prepare("UPDATE scenes SET tts_path = ?, tts_duration_ms = ?, target_video_duration_ms = ?, status = 'TTS_READY', updated_at = ? WHERE id = ?")
        .run(version.audioPath, version.durationMs, version.durationMs + 1200, now, input.sceneId);
      return version;
    },
    listAudioVersions(sceneId: string): AudioVersion[] {
      const scene = this.getScene(sceneId);
      return (database.prepare("SELECT * FROM audio_versions WHERE scene_id = ? ORDER BY version_number").all(sceneId) as AudioVersionRow[]).map((row) => {
        const audio = audioVersionFromRow(row);
        return audio.scriptHash || !scene ? audio : { ...audio, scriptHash: scene.narrationScriptHash, narrationRevision: scene.narrationRevision };
      });
    },
    getAudioVersion(audioVersionId: string): AudioVersion | undefined {
      const row = database.prepare("SELECT * FROM audio_versions WHERE id = ?").get(audioVersionId) as AudioVersionRow | undefined;
      return row && audioVersionFromRow(row);
    },
    selectAudioVersion(audioVersionId: string): AudioVersion | undefined {
      const version = this.getAudioVersion(audioVersionId); if (!version) return undefined;
      const scene = this.getScene(version.sceneId); if (!scene) return undefined;
      const now = new Date().toISOString();
      database.transaction(() => {
        database.prepare("UPDATE audio_versions SET status = 'READY', selected_at = NULL WHERE scene_id = ? AND status = 'SELECTED'").run(scene.id);
        database.prepare("UPDATE audio_versions SET status = 'SELECTED', selected_at = ? WHERE id = ? AND status = 'READY'").run(now, audioVersionId);
        database.prepare("UPDATE scenes SET selected_audio_version_id = ?, updated_at = ? WHERE id = ?").run(audioVersionId, now, scene.id);
      })();
      return this.getAudioVersion(audioVersionId);
    },
    rejectAudioVersion(audioVersionId: string): AudioVersion | undefined {
      const version = this.getAudioVersion(audioVersionId); if (!version || version.status === "APPROVED") return undefined;
      const now = new Date().toISOString();
      database.transaction(() => {
        database.prepare("UPDATE audio_versions SET status = 'REJECTED', selected_at = NULL WHERE id = ?").run(audioVersionId);
        database.prepare("UPDATE scenes SET selected_audio_version_id = CASE WHEN selected_audio_version_id = ? THEN NULL ELSE selected_audio_version_id END, updated_at = ? WHERE id = ?").run(audioVersionId, now, version.sceneId);
      })();
      return this.getAudioVersion(audioVersionId);
    },
    approveAudioVersion(audioVersionId: string): Scene | undefined {
      const selected = this.getAudioVersion(audioVersionId); if (!selected) return undefined;
      const scene = this.getScene(selected.sceneId); if (!scene || selected.status === "REJECTED" || (selected.scriptHash && selected.scriptHash !== scene.narrationScriptHash)) return undefined;
      const now = new Date().toISOString();
      database.transaction(() => {
        database.prepare("UPDATE audio_versions SET status = 'READY', approved_at = NULL WHERE scene_id = ? AND status = 'APPROVED'").run(scene.id);
        database.prepare("UPDATE audio_versions SET status = 'APPROVED', approved_at = ?, selected_at = ? WHERE id = ?").run(now, now, selected.id);
        database.prepare("UPDATE scenes SET tts_path = ?, tts_duration_ms = ?, target_video_duration_ms = ?, status = 'TTS_APPROVED', updated_at = ? WHERE id = ?")
          .run(selected.audioPath, selected.durationMs, selected.durationMs + 1200, now, scene.id);
      })();
      const updatedScene = this.getScene(scene.id); if (!updatedScene) return undefined;
      const remaining = this.listScenes(updatedScene.projectId).filter((item) => !this.listAudioVersions(item.id).some((audio) => audio.status === "APPROVED" && audio.scriptHash === item.narrationScriptHash)).length;
      if (remaining === 0) {
        const visualRemaining = database.prepare("SELECT COUNT(*) AS count FROM scenes WHERE project_id = ? AND approved_version_id IS NULL").get(updatedScene.projectId) as { count: number };
        database.prepare("UPDATE projects SET status = ?, updated_at = ? WHERE id = ?").run(visualRemaining.count === 0 ? "READY_TO_RENDER" : "VOICE_REVIEW", now, updatedScene.projectId);
      }
      return updatedScene;
    },
    approveTts(sceneId: string): Scene | undefined {
      const scene = this.getScene(sceneId); if (!scene) return undefined;
      const latest = this.listAudioVersions(sceneId).filter((audio) => audio.scriptHash === scene.narrationScriptHash && audio.status !== "REJECTED").at(-1);
      return latest ? this.approveAudioVersion(latest.id) : undefined;
    },
    createSceneVersion(input: { sceneId: string; provider: string; model?: string; prompt: string; negativePrompt: string; providerJobId?: string; videoPath?: string; durationMs?: number; status?: VersionStatus }): SceneVersion {
      const { sceneId } = input;
      const next = database.prepare("SELECT COALESCE(MAX(version_number), 0) + 1 AS version_number FROM scene_versions WHERE scene_id = ?").get(sceneId) as { version_number: number };
      const now = new Date().toISOString();
      const version: SceneVersion = { id: randomUUID(), sceneId, versionNumber: next.version_number, provider: input.provider, model: input.model ?? null, status: input.status ?? "QUEUED", prompt: input.prompt, negativePrompt: input.negativePrompt, providerJobId: input.providerJobId ?? null, videoPath: input.videoPath ?? null, durationMs: input.durationMs ?? null, errorMessage: null, createdAt: now, updatedAt: now };
      database.transaction(() => {
        database.prepare(`INSERT INTO scene_versions (id, scene_id, version_number, provider, video_model, provider_job_id, status, prompt, negative_prompt, video_path, duration_ms, created_at, updated_at)
          VALUES (@id, @sceneId, @versionNumber, @provider, @model, @providerJobId, @status, @prompt, @negativePrompt, @videoPath, @durationMs, @createdAt, @updatedAt)`).run(version);
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
        database.prepare("UPDATE projects SET status = ?, updated_at = ? WHERE id = ?").run(remaining.count === 0 ? "VOICE_REVIEW" : "SHOT_REVIEW", now, scene.projectId);
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
    getRenderReadiness(projectId: string) {
      const scenes = this.listScenes(projectId);
      const missingSceneIds = scenes.filter((scene) => {
        const approvedAudio = this.listAudioVersions(scene.id).filter((audio) => audio.status === "APPROVED" && audio.scriptHash === scene.narrationScriptHash).length === 1;
        const approvedVideo = this.listSceneVersions(scene.id).filter((version) => version.status === "APPROVED").length === 1;
        return !approvedAudio || !approvedVideo;
      }).map((scene) => scene.id);
      return { ready: scenes.length > 0 && missingSceneIds.length === 0, missingSceneIds, scenes };
    },
    createRenderVersion(projectId: string, musicPath?: string | null): RenderVersion {
      const next = database.prepare("SELECT COALESCE(MAX(version_number), 0) + 1 AS version_number FROM render_versions WHERE project_id = ?").get(projectId) as { version_number: number };
      const now = new Date().toISOString(); const render: RenderVersion = { id: randomUUID(), projectId, versionNumber: next.version_number, status: "RENDERING", currentStage: 1, startedAt: now, completedAt: null, outputPath: null, durationMs: null, errorMessage: null, musicPath: musicPath ?? null, createdAt: now };
      database.prepare(`INSERT INTO render_versions (id, project_id, version_number, status, current_stage, started_at, music_path, created_at)
        VALUES (@id, @projectId, @versionNumber, @status, @currentStage, @startedAt, @musicPath, @createdAt)`).run(render);
      database.prepare("UPDATE projects SET status = 'RENDERING', updated_at = ? WHERE id = ?").run(now, projectId);
      return render;
    },
    updateRenderVersion(renderId: string, input: Partial<Pick<RenderVersion, "status" | "currentStage" | "completedAt" | "outputPath" | "durationMs" | "errorMessage">>): RenderVersion | undefined {
      const current = database.prepare("SELECT * FROM render_versions WHERE id = ?").get(renderId) as RenderRow | undefined; if (!current) return undefined;
      const updated = { ...renderFromRow(current), ...input };
      database.prepare(`UPDATE render_versions SET status = @status, current_stage = @currentStage, completed_at = @completedAt, output_path = @outputPath, duration_ms = @durationMs, error_message = @errorMessage WHERE id = @id`).run(updated);
      if (updated.status === "COMPLETE" || updated.status === "FAILED") database.prepare("UPDATE projects SET status = ?, final_video_path = COALESCE(?, final_video_path), updated_at = ? WHERE id = ?").run(updated.status === "COMPLETE" ? "COMPLETE" : "FAILED", updated.outputPath, new Date().toISOString(), updated.projectId);
      return renderFromRow(database.prepare("SELECT * FROM render_versions WHERE id = ?").get(renderId) as RenderRow);
    },
    listRenderVersions(projectId: string): RenderVersion[] { return (database.prepare("SELECT * FROM render_versions WHERE project_id = ? ORDER BY version_number DESC").all(projectId) as RenderRow[]).map(renderFromRow); },
    getLatestRenderVersion(projectId: string): RenderVersion | undefined { const row = database.prepare("SELECT * FROM render_versions WHERE project_id = ? ORDER BY version_number DESC LIMIT 1").get(projectId) as RenderRow | undefined; return row && renderFromRow(row); },
  };
}
