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

export type ProjectStatus = z.infer<typeof projectStatusSchema>;
export type SceneStatus = z.infer<typeof sceneStatusSchema>;
export type VersionStatus = z.infer<typeof versionStatusSchema>;
export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
