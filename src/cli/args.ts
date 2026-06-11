import type { CliOptions } from "../types";

export function parseArgs(args: string[]): CliOptions {
  if (args.includes("--help") || args.includes("-h")) {
    printHelp();
    process.exit(0);
  }

  if (args.includes("--clear-cache")) {
    if (args.length > 1) {
      exitWithUsage("--clear-cache cannot be combined with other options.");
    }

    return { mode: "clear-cache" };
  }

  const portValue = valueAfter(args, "--port");
  const originValue = valueAfter(args, "--origin");

  if (!portValue || !originValue) {
    exitWithUsage("Both --port and --origin are required.");
  }

  const port = Number(portValue);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    exitWithUsage("--port must be an integer between 1 and 65535.");
  }

  const origin = parseOrigin(originValue);
  return { mode: "serve", port, origin };
}

function parseOrigin(value: string) {
  let origin: URL;

  try {
    origin = new URL(value);
  } catch {
    exitWithUsage("--origin must be a valid URL.");
  }

  if (origin.protocol !== "http:" && origin.protocol !== "https:") {
    exitWithUsage("--origin must use http or https.");
  }

  origin.pathname = origin.pathname.replace(/\/$/, "");
  origin.search = "";
  origin.hash = "";

  return origin.toString().replace(/\/$/, "");
}

function valueAfter(args: string[], flag: string): string | undefined {
  const index = args.indexOf(flag);
  return index === -1 ? undefined : args[index + 1];
}

function printHelp() {
  console.log(`Usage:
  croxy --port <number> --origin <url>
  croxy --clear-cache`);
}

function exitWithUsage(message: string): never {
  console.error(message);
  printHelp();
  process.exit(1);
}
