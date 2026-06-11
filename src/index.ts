#!/usr/bin/env bun

import { clearCache } from "./cache/cache-store";
import { parseArgs } from "./cli/args";
import { startProxyServer } from "./server";

async function main() {
  const options = parseArgs(Bun.argv.slice(2));

  if (options.mode === "clear-cache") {
    await clearCache();
    console.log("Cache cleared.");
    return;
  }

  await startProxyServer(options);
}

await main();
