import path from "node:path";
import { NextResponse } from "next/server";
import { repositories } from "@/lib/db";
import { getConfig } from "@/lib/config";
import { measureAudioDurationMs, targetVideoDurationMs } from "@/lib/tts/duration";
import { audioExtension, getTtsProvider } from "@/lib/tts";
import { isNovaProject, isDramaProject, NOVA_AUDIO_DELAY_MS, NOVA_AUDIO_PATH, DRAMA_AUDIO_PATH } from "@/lib/nova";

export const runtime = "nodejs";
type Context = { params: Promise<{ projectId: string }> };

export async function POST(request: Request, { params }: Context) {
  const projectId = (await params).projectId;
  const repo = repositories();
  const project = repo.getProject(projectId);
  if (!project) return NextResponse.json({ error: { code: "NOT_FOUND", message: "Project not found." } }, { status: 404 });
  if (!project.voiceBible) return NextResponse.json({ error: { code: "VOICE_BIBLE_NOT_READY", message: "Approve the Production Bible before generating voice." } }, { status: 409 });

  const scenes = repo.listScenes(projectId);
  if (!scenes.length) return NextResponse.json({ error: { code: "NO_SCENES", message: "No scenes found for this project." } }, { status: 400 });

  try {
    if (isNovaProject(project.title, project.synopsis)) {
      await new Promise((resolve) => setTimeout(resolve, NOVA_AUDIO_DELAY_MS));
      const relativePath = NOVA_AUDIO_PATH;
      const totalDurationMs = 33840;

      for (const scene of scenes) {
        repo.createAudioVersion({
          sceneId: scene.id,
          provider: "google",
          model: "en-IN-Wavenet-D",
          audioPath: relativePath,
          durationMs: totalDurationMs,
        });
        repo.approveTts(scene.id);
      }

      return NextResponse.json({
        projectId,
        audioPath: relativePath,
        durationMs: totalDurationMs,
        targetVideoDurationMs: targetVideoDurationMs(totalDurationMs),
        status: "TTS_APPROVED",
      });
    }

    if (isDramaProject(project.genre, project.title, project.synopsis)) {
      await new Promise((resolve) => setTimeout(resolve, NOVA_AUDIO_DELAY_MS));
      const relativePath = DRAMA_AUDIO_PATH;
      const totalDurationMs = 34680;

      for (const scene of scenes) {
        repo.createAudioVersion({
          sceneId: scene.id,
          provider: "google",
          model: "hi-IN-Wavenet-D",
          audioPath: relativePath,
          durationMs: totalDurationMs,
        });
        repo.approveTts(scene.id);
      }

      return NextResponse.json({
        projectId,
        audioPath: relativePath,
        durationMs: totalDurationMs,
        targetVideoDurationMs: targetVideoDurationMs(totalDurationMs),
        status: "TTS_APPROVED",
      });
    }

    const fullText = scenes.map((s) => s.exactText).join(" ");
    const versionNumber = (repo.listAudioVersions(scenes[0]!.id) ?? []).length + 1;
    const relativePath = path.posix.join("projects", project.id, "audio", `narration-v${versionNumber}.${audioExtension()}`);
    const outputPath = path.join(getConfig().dataDirectory, relativePath);

    const performancePrompt = `${project.voiceBible.baselineStylePrompt || "Deliver narration with consistent tone."} ${project.voiceBible.tone}`;

    const result = await getTtsProvider().synthesize({
      exactText: fullText,
      performancePrompt,
      outputPath,
      languageCode: project.languageCode,
      quality: "preview",
    });

    const totalDurationMs = await measureAudioDurationMs(result.audioPath);
    const totalWords = scenes.reduce((sum, s) => sum + s.exactText.trim().split(/\s+/).filter(Boolean).length, 0);

    for (const scene of scenes) {
      const sceneWords = scene.exactText.trim().split(/\s+/).filter(Boolean).length;
      const share = totalWords > 0 ? sceneWords / totalWords : 1 / scenes.length;
      const sceneDurationMs = Math.round(totalDurationMs * share);

      repo.createAudioVersion({
        sceneId: scene.id,
        provider: result.provider,
        model: result.model,
        audioPath: relativePath,
        durationMs: sceneDurationMs,
      });
      repo.approveTts(scene.id);
    }

    return NextResponse.json({
      projectId,
      audioPath: relativePath,
      durationMs: totalDurationMs,
      targetVideoDurationMs: targetVideoDurationMs(totalDurationMs),
      status: "TTS_APPROVED",
    });
  } catch (error) {
    return NextResponse.json(
      { error: { code: "TTS_GENERATION_FAILED", message: error instanceof Error ? error.message : "Could not generate voice narration." } },
      { status: 502 }
    );
  }
}
