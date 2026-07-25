import { plannedSceneSchema, productionBibleSchema, voiceBibleSchema } from "@/lib/domain/contracts";
import type { Project } from "@/lib/db/repositories";
import { validateSynopsisReconstruction } from "@/lib/synopsis/validate";
import { loadNarrationDirectorBrief } from "@/lib/planning/narration-director";
import type { PlanningResult, StoryPlanner } from "@/lib/planning/planner";

type OpenAISettings = { apiKey: string; model: string; endpoint: string };
type ResponsesBody = { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };

function settings(env: NodeJS.ProcessEnv = process.env): OpenAISettings {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI planning requires OPENAI_API_KEY in .env.local.");
  return { apiKey, model: env.OPENAI_TEXT_MODEL ?? "gpt-4o-mini", endpoint: env.OPENAI_RESPONSES_ENDPOINT ?? "https://api.openai.com/v1/responses" };
}

function responseText(body: ResponsesBody): string {
  const text = body.output_text ?? body.output?.flatMap((item) => item.content ?? []).map((item) => item.text ?? "").join("\n");
  if (!text?.trim()) throw new Error("OpenAI planning response did not contain text output.");
  return text.trim().replace(/^```json\s*|\s*```$/g, "");
}

export class OpenAIStoryPlanner implements StoryPlanner {
  async plan(project: Project, exactSegments: string[]): Promise<PlanningResult> {
    validateSynopsisReconstruction(project.synopsis, exactSegments);
    const config = settings(); const directorBrief = await loadNarrationDirectorBrief();
    const system = `${directorBrief}\n\nAPPLICATION SAFETY CONTRACT (higher priority):\n- Do not write a replacement trailer narration, translation, summary, or title.\n- The supplied exact narration segments are immutable source text. Copy every exactText value byte-for-byte.\n- Use the director brief only to guide story understanding, emotional arc, native-language performance direction, and cinematic visual planning.\n- Return exactly one JSON object matching the requested shape, with no markdown.`;
    const input = `Create a production bible and scene direction annotations for this project.\n\nTITLE: ${project.title}\nGENRE: ${project.genre}\nTARGET LANGUAGE: ${project.languageCode}\nOFFICIAL SYNOPSIS: ${project.synopsis}\n\nEXACT NARRATION SEGMENTS (copy exactText unchanged):\n${JSON.stringify(exactSegments)}\n\nReturn this JSON shape only:\n{\n  "productionBible": { "premise": {"text":"","groundedness":"FROM_SYNOPSIS|AI_INFERRED"}, "hook": {"text":"","groundedness":"FROM_SYNOPSIS|AI_INFERRED"}, "conflict": {"text":"","groundedness":"FROM_SYNOPSIS|AI_INFERRED"}, "tone": {"text":"","groundedness":"FROM_SYNOPSIS|AI_INFERRED"}, "mood": {"text":"","groundedness":"FROM_SYNOPSIS|AI_INFERRED"}, "visualStyle": {"text":"","groundedness":"FROM_SYNOPSIS|AI_INFERRED"}, "characters": [{"name":"","description":{"text":"","groundedness":"FROM_SYNOPSIS|AI_INFERRED"}}], "environments": [{"name":"","description":{"text":"","groundedness":"FROM_SYNOPSIS|AI_INFERRED"}}], "themes": [{"text":"","groundedness":"FROM_SYNOPSIS|AI_INFERRED"}], "trailerDurationSeconds": 30, "sceneCount": ${exactSegments.length} },\n  "voiceBible": { "narratorPersona":"", "voiceStyle":"", "tone":"", "baselinePace":"", "baselineEmotion":"", "pronunciationNotes":"", "languageCode":"${project.languageCode}", "ttsProvider":"elevenlabs", "providerVoice":"configured ElevenLabs voice", "accent":"", "timbre":"", "baselineStylePrompt":"" },\n  "scenes": [{ "sceneNumber": 1, "exactText":"", "emotion":"", "mood":"", "cameraIntent":"", "estimatedDurationSeconds": 4, "promptNotes":"", "intensity": 1, "pace":"", "energy":"", "endingStyle":"", "deliveryPrompt":"" }]\n}`;
    const response = await fetch(config.endpoint, { method: "POST", headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ model: config.model, instructions: system, input, temperature: 0.4 }) });
    if (!response.ok) throw new Error(`OpenAI planning failed: ${response.status} ${await response.text()}`);
    const payload = JSON.parse(responseText(await response.json() as ResponsesBody)) as { productionBible: unknown; voiceBible: unknown; scenes: unknown };
    const productionBible = productionBibleSchema.parse(payload.productionBible);
    const voiceBible = voiceBibleSchema.parse({ ...(payload.voiceBible as Record<string, unknown>), languageCode: project.languageCode, ttsProvider: "elevenlabs", providerVoice: process.env.ELEVENLABS_VOICE_ID ?? "swh0hLPsEaD50F02tIJJ" });
    const scenes = plannedSceneSchema.array().min(1).max(6).parse(payload.scenes);
    validateSynopsisReconstruction(project.synopsis, scenes.map((scene) => scene.exactText));
    return { productionBible, voiceBible, scenes };
  }
}
