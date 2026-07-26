import path from "node:path";
import { loadEnvConfig } from "@next/env";
import { z } from "zod";

const configurationSchema = z.object({
  dataDirectory: z.string().trim().min(1),
});

export type AppConfig = z.infer<typeof configurationSchema>;

export function getConfig(env: NodeJS.ProcessEnv = process.env): AppConfig {
  loadEnvConfig(process.cwd());
  const isVercel = Boolean(env.VERCEL);
  return configurationSchema.parse({
    dataDirectory: env.POCKETFRAME_DATA_DIR ?? (isVercel ? "/tmp" : path.join(process.cwd(), "data")),
  });
}
