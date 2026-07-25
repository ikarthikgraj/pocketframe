export type TtsRequest = {
  exactText: string;
  performancePrompt: string;
  outputPath: string;
  languageCode: string;
  quality: "preview" | "final";
};

export type TtsResult = { provider: string; model: string; audioPath: string; providerRequestId?: string };

export interface TtsProvider {
  synthesize(input: TtsRequest): Promise<TtsResult>;
}
