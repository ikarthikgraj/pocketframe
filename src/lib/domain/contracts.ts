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
  trailerDurationSeconds: z.number().int().min(20).max(90),
  sceneCount: z.number().int().min(1).max(6),
});

export const plannedSceneSchema = z.object({
  sceneNumber: z.number().int().positive(),
  exactText: z.string().min(1),
  emotion: z.string().trim().min(1),
  mood: z.string().trim().min(1),
  cameraIntent: z.string().trim().min(1),
  estimatedDurationSeconds: z.number().positive(),
  promptNotes: z.string().trim().min(1),
});

export const analyzeProjectSchema = z.object({
  maxScenes: z.number().int().min(1).max(6).optional().default(6),
});

export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type SceneStatus = z.infer<typeof sceneStatusSchema>;
export type VersionStatus = z.infer<typeof versionStatusSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type ProductionBible = z.infer<typeof productionBibleSchema>;
export type PlannedScene = z.infer<typeof plannedSceneSchema>;
