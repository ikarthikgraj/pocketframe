import { createHash } from "node:crypto";

export function narrationScriptHash(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
