import { normalizeSynopsis } from "./segment";

export class SynopsisReconstructionError extends Error {
  code = "SYNOPSIS_RECONSTRUCTION_FAILED";
}

export function validateSynopsisReconstruction(synopsis: string, chunks: string[]): void {
  if (normalizeSynopsis(synopsis) !== chunks.join("")) {
    throw new SynopsisReconstructionError("Narration chunks do not reconstruct the normalized source synopsis exactly.");
  }
}
