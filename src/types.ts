export type CliOptions =
  | { mode: "serve"; port: number; origin: string }
  | { mode: "clear-cache" };

export type ServerOptions = Extract<CliOptions, { mode: "serve" }>;

export type CacheStatus = "HIT" | "MISS";

export type CachedResponse = {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  bodyBase64: string;
};
