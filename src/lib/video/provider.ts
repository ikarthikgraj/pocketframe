export type VideoRequest = {
  sceneId: string;
  versionNumber: number;
  prompt: string;
  negativePrompt: string;
  targetDurationMs: number;
  outputPath: string;
};

export type VideoJob = { provider: string; providerJobId?: string; outputPath: string };
export type VideoJobStatus = { status: "QUEUED" | "GENERATING" | "READY" | "FAILED"; videoPath?: string; durationMs?: number; errorMessage?: string };

export interface VideoProvider {
  submit(input: VideoRequest): Promise<VideoJob>;
  getStatus(job: VideoJob): Promise<VideoJobStatus>;
}
