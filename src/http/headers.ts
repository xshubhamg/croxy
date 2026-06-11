import type { Request } from "express";

const HOP_BY_HOP_HEADERS = new Set([
  "connection",
  "content-encoding",
  "content-length",
  "keep-alive",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "transfer-encoding",
  "upgrade",
]);

export function buildForwardHeaders(req: Request) {
  const headers = new Headers();

  for (const [name, value] of Object.entries(req.headers)) {
    if (!value || HOP_BY_HOP_HEADERS.has(name.toLowerCase()) || name.toLowerCase() === "host") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        headers.append(name, item);
      }
    } else {
      headers.set(name, value);
    }
  }

  return headers;
}

export function filterResponseHeaders(headers: Headers) {
  const filteredHeaders: Record<string, string> = {};

  headers.forEach((value, name) => {
    if (!HOP_BY_HOP_HEADERS.has(name.toLowerCase())) {
      filteredHeaders[name] = value;
    }
  });

  return filteredHeaders;
}
