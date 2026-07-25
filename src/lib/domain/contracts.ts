import { z } from "zod";

export const projectStatusSchema = z.enum([
  "DRAFT", "ANALYZING", "BIBLE_READY", "VOICE_REVIEW", "SHOT_GENERATION",
  "SHOT_REVIEW", "READY_TO_RENDER", "RENDERING", "COMPLETE", "FAILED",
]);
export const sceneStatusSchema = z.enum([
  "DRAFT", "TTS_READY", "TTS_APPROVED", "VIDEO_READY", "VIDEO_QUEUED",
  "VIDEO_GENERATING", "VIDEO_REVIEW", "APPROVED", "FAILED",
]);
export const versionStatusSchema = z.enum([
  "QUEUED", "GENERATING", "READY", "APPROVED", "REJECTED", "FAILED",
]);

export const createProjectSchema = z.object({
  title: z.string().trim().min(1).max(160),
  synopsis: z.string().min(1).max(10_000),
  genre: z.string().trim().min(1).max(100),
  languageCode: z.string().trim().min(2).max(35),
});

export const updateProjectSchema = createProjectSchema.partial().extend({
  status: projectStatusSchema.optional(),
});

export const groundedTextSchema = z.object({
  text: z.string().trim().min(1),
  groundedness: z.enum(["FROM_SYNOPSIS", "AI_INFERRED"]),
});

export const productionBibleSchema = z.object({
  premise: groundedTextSchema,
  hook: groundedTextSchema,
  conflict: groundedTextSchema,
  tone: groundedTextSchema,
  mood: groundedTextSchema,
  visualStyle: groundedTextSchema,
  characters: z.array(z.object({ name: z.string().trim().min(1), description: groundedTextSchema })).min(1),
  environments: z.array(z.object({ name: z.string().trim().min(1), description: groundedTextSchema })).min(1),
  themes: z.array(groundedTextSchema).min(1),
  trailerDurationSeconds: z.number().int().min(25).max(45),
  sceneCount: z.number().int().min(1).max(5),
});

export const voiceBibleSchema = z.object({
  narratorPersona: z.string().trim().min(1),
  voiceStyle: z.string().trim().min(1),
  tone: z.string().trim().min(1),
  baselinePace: z.string().trim().min(1),
  baselineEmotion: z.string().trim().min(1),
  pronunciationNotes: z.string(),
  languageCode: z.string().trim().min(2).max(35),
  ttsProvider: z.string().trim().min(1),
  providerVoice: z.string().trim().min(1),
  accent: z.string().trim().min(1),
  timbre: z.string().trim().min(1),
  baselineStylePrompt: z.string().trim().min(1),
});

export const plannedSceneSchema = z.object({
  sceneNumber: z.number().int().positive(),
  exactText: z.string().min(1),
  emotion: z.string().trim().min(1),
  mood: z.string().trim().min(1),
  cameraIntent: z.string().trim().min(1),
  estimatedDurationSeconds: z.number().positive(),
  promptNotes: z.string().trim().min(1),
  intensity: z.number().int().min(1).max(10),
  pace: z.string().trim().min(1),
  energy: z.string().trim().min(1),
  endingStyle: z.string().trim().min(1),
  deliveryPrompt: z.string().trim().min(1),
});

export const analyzeProjectSchema = z.object({
  maxScenes: z.number().int().min(1).max(5).optional().default(4),
});

export const generateTtsSchema = z.object({
  deliveryPrompt: z.string().trim().min(1).max(2_000).optional(),
  quality: z.enum(["preview", "final"]).optional().default("preview"),
});

export const approveTtsSchema = z.object({ approved: z.literal(true) });

export const generateVideoSchema = z.object({
  prompt: z.string().trim().min(1).max(8_000).optional(),
  provider: z.enum(["mock", "real"]).optional().default("mock"),
});

export const rejectSceneVersionSchema = z.object({
  reason: z.string().trim().min(1).max(2_000).optional(),
});
export const renderTrailerSchema = z.object({
  subtitles: z.boolean().optional().default(false),
  title: z.string().trim().min(1).max(160).optional(),
  cta: z.string().trim().min(1).max(160).optional().default("Listen now on Pocket FM"),
  musicPath: z.string().trim().min(1).max(1_000).nullable().optional(),
});

export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type SceneStatus = z.infer<typeof sceneStatusSchema>;
export type VersionStatus = z.infer<typeof versionStatusSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProductionBible = z.infer<typeof productionBibleSchema>;
export type VoiceBible = z.infer<typeof voiceBibleSchema>;
export type PlannedScene = z.infer<typeof plannedSceneSchema>;
