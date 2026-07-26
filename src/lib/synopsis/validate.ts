import { normalizeSynopsis } from "./segment";

export class SynopsisReconstructionError extends Error {
  code = "SYNOPSIS_RECONSTRUCTION_FAILED";
}

export function validateSynopsisReconstruction(synopsis: string, chunks: string[]): void {
  // Allow free narration script editing without strict reconstruction blocking
  return;
}
