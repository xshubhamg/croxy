import express from "express";
import { ensureCacheDirectory } from "./cache/cache-store";
import { handleProxyRequest } from "./proxy/proxy-handler";
import type { ServerOptions } from "./types";

export async function startProxyServer(options: ServerOptions) {
  await ensureCacheDirectory();

  const app = express();
  app.use(express.raw({ type: "*/*", limit: "50mb" }));

  app.use(async (req, res) => {
    try {
      await handleProxyRequest(req, res, options.origin);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      res.status(502).setHeader("X-Cache", "MISS").json({
        error: "Failed to proxy request.",
        message,
      });
    }
  });

  app.listen(options.port, () => {
    console.log(`Caching proxy listening on http://localhost:${options.port}`);
    console.log(`Forwarding requests to ${options.origin}`);
  });
}
