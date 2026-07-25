import path from "node:path";
import { MockTtsProvider } from "../src/lib/tts/mock-provider";
import { MockVideoProvider } from "../src/lib/video/mock-provider";
import { stitchTrailer } from "../src/lib/media/stitcher";

async function main() { const root = path.join(process.cwd(), "data"); const projectId = `phase5-smoke-${Date.now()}`; const videoPath = `projects/${projectId}/videos/scene-01.mp4`; const audioPath = `projects/${projectId}/audio/scene-01.wav`;
  await new MockTtsProvider().synthesize({ exactText: "A quiet promise begins tonight.", performancePrompt: "", outputPath: path.join(root, audioPath), languageCode: "en-IN", quality: "preview" });
  await new MockVideoProvider().submit({ sceneId: "scene-01", versionNumber: 1, prompt: "Cinematic vertical night city.", negativePrompt: "", targetDurationMs: 2_000, outputPath: path.join(root, videoPath) });
  const result = await stitchTrailer({ projectId, renderVersion: 1, title: "PocketFrame Smoke", tagline: "A quiet promise", cta: "Listen now on Pocket FM", subtitles: false, scenes: [{ sceneId: "scene-01", sceneNumber: 1, exactText: "A quiet promise begins tonight.", videoPath, audioPath, audioDurationMs: 2_000, targetDurationMs: 3_200 }] });
  console.log(path.join(root, result.outputPath)); }
void main();
