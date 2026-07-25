CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  synopsis TEXT NOT NULL,
  genre TEXT NOT NULL,
  language_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  cover_path TEXT,
  references_json TEXT NOT NULL DEFAULT '[]',
  story_bible_json TEXT,
  visual_bible_json TEXT,
  voice_bible_json TEXT,
  final_video_path TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS scenes (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  scene_number INTEGER NOT NULL,
  exact_text TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT',
  emotion TEXT,
  intensity INTEGER,
  pace TEXT,
  energy TEXT,
  ending_style TEXT,
  delivery_prompt TEXT,
  visual_purpose TEXT,
  video_prompt TEXT,
  tts_path TEXT,
  tts_duration_ms INTEGER,
  target_video_duration_ms INTEGER,
  approved_version_id TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(project_id, scene_number)
);

CREATE TABLE IF NOT EXISTS scene_versions (
  id TEXT PRIMARY KEY,
  scene_id TEXT NOT NULL REFERENCES scenes(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  provider TEXT NOT NULL,
  provider_job_id TEXT,
  status TEXT NOT NULL DEFAULT 'QUEUED',
  prompt TEXT,
  video_path TEXT,
  duration_ms INTEGER,
  error_message TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  UNIQUE(scene_id, version_number)
);

CREATE INDEX IF NOT EXISTS scenes_project_id_idx ON scenes(project_id);
CREATE INDEX IF NOT EXISTS scene_versions_scene_id_idx ON scene_versions(scene_id);

CREATE TABLE IF NOT EXISTS render_versions (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'NOT_READY',
  started_at TEXT,
  completed_at TEXT,
  output_path TEXT,
  duration_ms INTEGER,
  error_message TEXT,
  music_path TEXT,
  created_at TEXT NOT NULL,
  UNIQUE(project_id, version_number)
);

CREATE INDEX IF NOT EXISTS render_versions_project_id_idx ON render_versions(project_id);
