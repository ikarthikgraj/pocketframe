import fs from "node:fs/promises";
import path from "node:path";

/**
 * Loads the user-managed narrative-director brief without putting it in the
 * client bundle or a tracked source constant. The application appends its
 * exact-text safety contract before sending the brief to a text provider.
 */
export async function loadNarrationDirectorBrief(env: NodeJS.ProcessEnv = process.env): Promise<string> {
  const promptPath = env.NARRATION_DIRECTOR_PROMPT_PATH ?? path.resolve(process.cwd(), "..", "narration_system.txt");
  try {
    const brief = await fs.readFile(promptPath, "utf8");
    if (!brief.trim()) throw new Error("empty");
    return brief;
  } catch {
    throw new Error(`Narration director brief is unavailable at ${promptPath}. Set NARRATION_DIRECTOR_PROMPT_PATH to the supplied narration_system.txt file.`);
  }
}
