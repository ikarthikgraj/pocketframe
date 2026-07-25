import type { VideoJob, VideoJobStatus, VideoProvider, VideoRequest } from "./provider";

/**
 * Provider selection and credentials are intentionally deferred.
 * TODO: map VideoRequest to the selected provider's request, store its job ID,
 * poll completion, download the MP4 to outputPath, and return its measured duration.
 */
export class RealVideoProvider implements VideoProvider {
  async submit(input: VideoRequest): Promise<VideoJob> { void input; throw new Error("A real video provider has not been configured. Use mock generation or upload an MP4."); }
  async getStatus(job: VideoJob): Promise<VideoJobStatus> { void job; throw new Error("A real video provider has not been configured."); }
}
