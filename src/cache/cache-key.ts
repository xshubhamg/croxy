import { createHash } from "node:crypto";

export function createCacheKey(method: string, originalUrl: string, body: Buffer) {
  return createHash("sha256")
    .update(method.toUpperCase())
    .update("\0")
    .update(originalUrl)
    .update("\0")
    .update(body)
    .digest("hex");
}
