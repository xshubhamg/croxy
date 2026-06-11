import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { CachedResponse } from "../types";

const CACHE_DIR = path.join(process.cwd(), ".croxy-cache");

export async function ensureCacheDirectory() {
  await mkdir(CACHE_DIR, { recursive: true });
}

export async function readCachedResponse(cacheKey: string) {
  try {
    const contents = await readFile(cachePath(cacheKey), "utf8");
    return JSON.parse(contents) as CachedResponse;
  } catch {
    return null;
  }
}

export async function writeCachedResponse(cacheKey: string, response: CachedResponse) {
  await ensureCacheDirectory();
  await writeFile(cachePath(cacheKey), JSON.stringify(response), "utf8");
}

export async function clearCache() {
  await rm(CACHE_DIR, { recursive: true, force: true });
}

function cachePath(cacheKey: string) {
  return path.join(CACHE_DIR, `${cacheKey}.json`);
}
