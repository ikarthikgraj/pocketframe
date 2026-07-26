import { plannedSceneSchema, productionBibleSchema, voiceBibleSchema } from "@/lib/domain/contracts";
import type { Project } from "@/lib/db/repositories";
import { validateSynopsisReconstruction } from "@/lib/synopsis/validate";
import { loadNarrationDirectorBrief } from "@/lib/planning/narration-director";
import { MockStoryPlanner, type PlanningResult, type StoryPlanner } from "@/lib/planning/planner";

type OpenAISettings = { apiKey: string; model: string; endpoint: string };
type ResponsesBody = { output_text?: string; output?: Array<{ content?: Array<{ text?: string }> }> };

function settings(env: NodeJS.ProcessEnv = process.env): OpenAISettings {
  const apiKey = env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI planning requires OPENAI_API_KEY in .env.local.");
  return {
    apiKey,
    model: env.OPENAI_TEXT_MODEL ?? "gpt-4o-mini",
    endpoint: env.OPENAI_RESPONSES_ENDPOINT ?? "https://api.openai.com/v1/responses",
  };
}

function responseText(body: ResponsesBody): string {
  const text = body.output_text ?? body.output?.flatMap((item) => item.content ?? []).map((item) => item.text ?? "").join("\n");
  if (!text?.trim()) throw new Error("OpenAI planning response did not contain text output.");
  return text.trim().replace(/^```json\s*|\s*```$/g, "");
}

function cleanGroundedness(val: unknown): "FROM_SYNOPSIS" | "AI_INFERRED" {
  if (typeof val === "string" && (val.toUpperCase().includes("SYNOPSIS") || val.toUpperCase().includes("FROM"))) {
    return "FROM_SYNOPSIS";
  }
  return "AI_INFERRED";
}

function cleanGroundedObject(obj: unknown, defaultText: string): { text: string; groundedness: "FROM_SYNOPSIS" | "AI_INFERRED" } {
  const o = (typeof obj === "object" && obj !== null ? obj : {}) as Record<string, unknown>;
  return {
    text: typeof o.text === "string" && o.text.trim() ? o.text.trim() : defaultText,
    groundedness: cleanGroundedness(o.groundedness),
  };
}

function sanitizeProductionBible(raw: unknown, project: Project, exactSegments: string[]) {
  const b = (typeof raw === "object" && raw !== null ? raw : {}) as Record<string, unknown>;

  const charactersRaw = Array.isArray(b.characters) ? b.characters : [];
  const characters = charactersRaw.map((c: any) => ({
    name: typeof c?.name === "string" && c.name.trim() ? c.name.trim() : "Protagonist",
    description: cleanGroundedObject(c?.description, "Character referenced in synopsis"),
  }));
  if (!characters.length) {
    characters.push({
      name: "Protagonist",
      description: { text: "Main character from synopsis", groundedness: "FROM_SYNOPSIS" },
    });
  }

  const envsRaw = Array.isArray(b.environments) ? b.environments : [];
  const environments = envsRaw.map((e: any) => ({
    name: typeof e?.name === "string" && e.name.trim() ? e.name.trim() : "Primary Setting",
    description: cleanGroundedObject(e?.description, "Setting inferred from synopsis"),
  }));
  if (!environments.length) {
    environments.push({
      name: "Primary Setting",
      description: { text: "Setting inferred from synopsis", groundedness: "AI_INFERRED" },
    });
  }

  const themesRaw = Array.isArray(b.themes) ? b.themes : [];
  const themes = themesRaw.map((t: any) => cleanGroundedObject(t, "Core dramatic choice"));
  if (!themes.length) {
    themes.push({ text: "Core dramatic choice", groundedness: "AI_INFERRED" });
  }

  return productionBibleSchema.parse({
    premise: cleanGroundedObject(b.premise, project.synopsis),
    hook: cleanGroundedObject(b.hook, `A cinematic entry into ${project.title}`),
    conflict: cleanGroundedObject(b.conflict, "The core conflict described in the synopsis"),
    tone: cleanGroundedObject(b.tone, `${project.genre} with controlled tension`),
    mood: cleanGroundedObject(b.mood, "Suspenseful"),
    visualStyle: cleanGroundedObject(b.visualStyle, "Grounded cinematic realism"),
    characters,
    environments,
    themes,
    trailerDurationSeconds: Number(b.trailerDurationSeconds) || Math.min(40, Math.max(30, exactSegments.length * 8)),
    sceneCount: exactSegments.length,
  });
}

function sanitizeScenes(raw: unknown, exactSegments: string[]) {
  const list = (Array.isArray(raw) ? raw : []) as Array<Record<string, unknown>>;
  return exactSegments.map((exactText, idx) => {
    const s = list[idx] ?? {};
    return plannedSceneSchema.parse({
      sceneNumber: idx + 1,
      exactText, // Guaranteed byte-for-byte synopsis segment match
      emotion: typeof s.emotion === "string" && s.emotion ? s.emotion : idx === exactSegments.length - 1 ? "Urgency" : "Controlled tension",
      mood: typeof s.mood === "string" && s.mood ? s.mood : "Suspenseful",
      cameraIntent: typeof s.cameraIntent === "string" && s.cameraIntent ? s.cameraIntent : "Slow establishing push-in",
      estimatedDurationSeconds: Number(s.estimatedDurationSeconds) || Math.max(4, Math.ceil(exactText.trim().split(/\s+/).length / 2.5)),
      promptNotes: typeof s.promptNotes === "string" && s.promptNotes ? s.promptNotes : "Use approved visual style",
      intensity: Math.min(10, Math.max(1, Number(s.intensity) || (idx === exactSegments.length - 1 ? 8 : 6))),
      pace: typeof s.pace === "string" && s.pace ? s.pace : "Measured",
      energy: typeof s.energy === "string" && s.energy ? s.energy : "Controlled",
      endingStyle: typeof s.endingStyle === "string" && s.endingStyle ? s.endingStyle : "Hold the final word briefly",
      deliveryPrompt: typeof s.deliveryPrompt === "string" && s.deliveryPrompt ? s.deliveryPrompt : "Deliver with restrained tension.",
    });
  });
}

export class OpenAIStoryPlanner implements StoryPlanner {
  async plan(project: Project, exactSegments: string[]): Promise<PlanningResult> {
    validateSynopsisReconstruction(project.synopsis, exactSegments);
    try {
      const config = settings();
      const directorBrief = await loadNarrationDirectorBrief();
      const system = `You are a production planning assistant for a cinematic trailer creation platform.

======================================================================
NARRATION DIRECTOR BRIEF (Your Creative Framework)
======================================================================

The following is the narration director brief that defines the creative standards, storytelling philosophy, emotional arc structure, character introduction approach, language quality requirements, and voice-over optimization rules. You MUST use this brief as your creative framework when filling in every field of the production bible, voice bible, and scene direction.

${directorBrief}

======================================================================
YOUR TASK
======================================================================

Using the storytelling principles, emotional arc structure, character introduction approach, language quality requirements, and voice-over optimization rules from the narration director brief above:

1. PRODUCTION BIBLE: Create a cinematic production bible that captures the story's premise, hook, conflict, tone, mood, and visual style — all shaped by the director brief's philosophy of building curiosity, emotional momentum, and cinematic quality.

2. VOICE BIBLE: Define narrator persona, voice style, tone, pace, emotion, and delivery direction — guided by the brief's voice-over optimization rules (write for the ear, natural pauses, smooth rhythm, short cinematic sentences).

3. SCENE DIRECTION: For each exact narration segment, provide emotion, mood, camera intent, intensity, pace, energy, ending style, and delivery prompts — following the brief's emotional arc (Hook → Character Introduction → Conflict → Rising Emotion → Mystery → Powerful Emotional Hook).

======================================================================
SAFETY CONTRACT (Highest Priority)
======================================================================

- The supplied exact narration segments are immutable source text. Copy every exactText value byte-for-byte into the scenes array.
- Do NOT write replacement narration, translations, summaries, or titles.
- Return exactly one JSON object matching the requested shape, with no markdown wrapping.
- groundedness must be exactly "FROM_SYNOPSIS" or "AI_INFERRED" (no other values).`;

      const input = `Create a production bible and scene direction annotations for this project.

TITLE: ${project.title}
GENRE: ${project.genre}
TARGET LANGUAGE: ${project.languageCode}
OFFICIAL SYNOPSIS: ${project.synopsis}

EXACT NARRATION SEGMENTS (copy exactText byte-for-byte into scenes):
${JSON.stringify(exactSegments)}

Return this JSON shape only:
{
  "productionBible": { "premise": {"text":"","groundedness":"FROM_SYNOPSIS"}, "hook": {"text":"","groundedness":"AI_INFERRED"}, "conflict": {"text":"","groundedness":"FROM_SYNOPSIS"}, "tone": {"text":"","groundedness":"AI_INFERRED"}, "mood": {"text":"","groundedness":"AI_INFERRED"}, "visualStyle": {"text":"","groundedness":"AI_INFERRED"}, "characters": [{"name":"","description":{"text":"","groundedness":"FROM_SYNOPSIS"}}], "environments": [{"name":"","description":{"text":"","groundedness":"AI_INFERRED"}}], "themes": [{"text":"","groundedness":"AI_INFERRED"}], "trailerDurationSeconds": 30, "sceneCount": ${exactSegments.length} },
  "voiceBible": { "narratorPersona":"", "voiceStyle":"", "tone":"", "baselinePace":"", "baselineEmotion":"", "pronunciationNotes":"", "languageCode":"${project.languageCode}", "ttsProvider":"elevenlabs", "providerVoice":"configured ElevenLabs voice", "accent":"", "timbre":"", "baselineStylePrompt":"" },
  "scenes": [{ "sceneNumber": 1, "exactText":"", "emotion":"", "mood":"", "cameraIntent":"", "estimatedDurationSeconds": 4, "promptNotes":"", "intensity": 1, "pace":"", "energy":"", "endingStyle":"", "deliveryPrompt":"" }]
}`;

      const response = await fetch(config.endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${config.apiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: config.model, instructions: system, input, temperature: 0.4 }),
      });

      if (!response.ok) {
        console.warn(`OpenAI API warning (${response.status}), falling back to deterministic story planner.`);
        return new MockStoryPlanner().plan(project, exactSegments);
      }

      const payload = JSON.parse(responseText((await response.json()) as ResponsesBody)) as {
        productionBible: unknown;
        voiceBible: unknown;
        scenes: unknown;
      };

      const productionBible = sanitizeProductionBible(payload.productionBible, project, exactSegments);
      const voiceBible = voiceBibleSchema.parse({
        ...((payload.voiceBible as Record<string, unknown>) ?? {}),
        languageCode: project.languageCode,
        ttsProvider: process.env.POCKETFRAME_TTS_PROVIDER === "elevenlabs" ? "elevenlabs" : process.env.POCKETFRAME_TTS_PROVIDER === "gemini" ? "gemini" : "mock",
        providerVoice: process.env.POCKETFRAME_TTS_PROVIDER === "elevenlabs" ? (process.env.ELEVENLABS_VOICE_ID ?? "swh0hLPsEaD50F02tIJJ") : process.env.POCKETFRAME_TTS_PROVIDER === "gemini" ? (process.env.GEMINI_TTS_VOICE ?? "Kore") : "default-narrator",
      });
      const scenes = sanitizeScenes(payload.scenes, exactSegments);

      validateSynopsisReconstruction(project.synopsis, scenes.map((s) => s.exactText));
      return { productionBible, voiceBible, scenes };
    } catch (error) {
      console.warn("OpenAI planning failed or returned non-conforming data, falling back to deterministic planner:", error);
      return new MockStoryPlanner().plan(project, exactSegments);
    }
  }
}
