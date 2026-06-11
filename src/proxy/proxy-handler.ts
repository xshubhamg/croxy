import type { Request, Response } from "express";
import { createCacheKey } from "../cache/cache-key";
import { readCachedResponse, writeCachedResponse } from "../cache/cache-store";
import { buildForwardHeaders, filterResponseHeaders } from "../http/headers";
import type { CachedResponse, CacheStatus } from "../types";

export async function handleProxyRequest(req: Request, res: Response, origin: string) {
  const requestBody = Buffer.isBuffer(req.body) ? req.body : Buffer.alloc(0);
  const cacheKey = createCacheKey(req.method, req.originalUrl, requestBody);
  const cachedResponse = await readCachedResponse(cacheKey);

  if (cachedResponse) {
    sendResponse(res, cachedResponse, "HIT");
    return;
  }

  const originResponse = await fetch(`${origin}${req.originalUrl}`, {
    method: req.method,
    headers: buildForwardHeaders(req),
    body: shouldSendBody(req.method) ? new Uint8Array(requestBody).buffer : undefined,
    redirect: "manual",
  });

  const responseBuffer = Buffer.from(await originResponse.arrayBuffer());
  const responseToCache: CachedResponse = {
    status: originResponse.status,
    statusText: originResponse.statusText,
    headers: filterResponseHeaders(originResponse.headers),
    bodyBase64: responseBuffer.toString("base64"),
  };

  await writeCachedResponse(cacheKey, responseToCache);
  sendResponse(res, responseToCache, "MISS");
}

function sendResponse(res: Response, cachedResponse: CachedResponse, cacheStatus: CacheStatus) {
  res.status(cachedResponse.status);

  for (const [name, value] of Object.entries(cachedResponse.headers)) {
    res.setHeader(name, value);
  }

  res.setHeader("X-Cache", cacheStatus);
  res.send(Buffer.from(cachedResponse.bodyBase64, "base64"));
}

function shouldSendBody(method: string) {
  return method !== "GET" && method !== "HEAD";
}
