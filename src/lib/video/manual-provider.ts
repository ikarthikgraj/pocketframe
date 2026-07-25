import type { VideoJob, VideoJobStatus, VideoProvider, VideoRequest } from "./provider";

/** Manual uploads are persisted directly by the upload route and are instantly reviewable. */
export class ManualUploadProvider implements VideoProvider {
  async submit(input: VideoRequest): Promise<VideoJob> { return { provider: "manual", outputPath: input.outputPath }; }
  async getStatus(job: VideoJob): Promise<VideoJobStatus> { return { status: "READY", videoPath: job.outputPath }; }
}
