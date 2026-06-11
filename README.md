# Croxy

Croxy is a command-line caching proxy server built with Bun, TypeScript, and Express. It sits between a client and an origin server, forwards incoming HTTP requests to the origin, stores the origin response on disk, and serves the cached response when the same request is made again.

The project is intentionally small and direct. It is useful for understanding the practical mechanics of HTTP proxying, cache keys, response serialization, and cache invalidation without hiding the behavior behind a large framework.

## What This Project Does

Croxy starts a local HTTP server on a port you choose. Every request received by that local server is forwarded to an origin URL that you configure at startup.

For example, if Croxy is started with this command:

```sh
croxy --port 3000 --origin http://dummyjson.com
```

Then this local request:

```sh
curl http://localhost:3000/products
```

is forwarded to:

```txt
http://dummyjson.com/products
```

The first request is fetched from the origin server and saved in the local cache. A later request with the same method, path, query string, and body is served directly from the cache instead of contacting the origin server again.

## Key Features

- Starts a caching proxy server from the command line.
- Accepts a configurable local port through `--port`.
- Accepts a configurable origin server through `--origin`.
- Forwards requests to the origin while preserving the request path and query string.
- Caches complete origin responses on disk.
- Returns cached responses for repeated matching requests.
- Adds an `X-Cache` response header so callers can see whether a response came from the cache or origin.
- Provides a `--clear-cache` command for removing stored cached responses.
- Uses TypeScript with strict compiler settings.
- Uses Express for HTTP routing and Bun as the runtime.

## Cache Behavior

Croxy uses a deterministic cache key generated from:

- HTTP method
- Original request path
- Query string
- Request body

This means these requests are cached separately:

```txt
GET /products
GET /products?limit=10
POST /products/search with body A
POST /products/search with body B
```

Responses are stored in the `.croxy-cache` directory in the current working directory. Each cached response is serialized as JSON and includes:

- Status code
- Status text
- Response headers
- Response body encoded as base64

The base64 body storage allows Croxy to cache text, JSON, HTML, images, and other binary response payloads without corrupting the response data.

## Cache Status Header

Every proxied response includes an `X-Cache` header.

When the response is fetched from the origin server:

```txt
X-Cache: MISS
```

When the response is returned from the local cache:

```txt
X-Cache: HIT
```

This makes cache behavior visible during development and testing.

## Requirements

- Bun
- Node-compatible shell environment

The project was built and tested with Bun `1.3.14`.

## Installation

Install dependencies:

```sh
bun install
```

## Running The Proxy

Run the proxy directly from the source file:

```sh
bun src/index.ts --port 3000 --origin http://dummyjson.com
```

Then request the local proxy:

```sh
curl -i http://localhost:3000/products
```

The first response should include:

```txt
X-Cache: MISS
```

Run the same request again:

```sh
curl -i http://localhost:3000/products
```

The second response should include:

```txt
X-Cache: HIT
```

## Using The CLI Command

The package defines a binary named `croxy` in `package.json`.

In a local development environment, you can run it through Bun:

```sh
bun src/index.ts --port 3000 --origin http://dummyjson.com
```

If the package is linked or installed as a command, use:

```sh
croxy --port 3000 --origin http://dummyjson.com
```

## Clearing The Cache

Clear all cached responses:

```sh
bun src/index.ts --clear-cache
```

Or, when using the linked or installed CLI command:

```sh
croxy --clear-cache
```

This removes the `.croxy-cache` directory from the current working directory.

## Available Commands

Start the proxy:

```sh
croxy --port <number> --origin <url>
```

Clear the cache:

```sh
croxy --clear-cache
```

Show help:

```sh
croxy --help
```

## Project Structure

```txt
.
├── src
│   ├── cache
│   │   ├── cache-key.ts
│   │   └── cache-store.ts
│   ├── cli
│   │   └── args.ts
│   ├── http
│   │   └── headers.ts
│   ├── proxy
│   │   └── proxy-handler.ts
│   ├── index.ts
│   ├── server.ts
│   └── types.ts
├── .gitignore
├── bun.lock
├── package.json
├── README.md
└── tsconfig.json
```

## Implementation Details

The application keeps `src/index.ts` as a small executable entrypoint and moves the actual behavior into focused modules.

The source layout is organized by responsibility:

- `src/index.ts` starts the CLI flow.
- `src/cli/args.ts` parses and validates command-line options.
- `src/server.ts` creates and starts the Express application.
- `src/proxy/proxy-handler.ts` handles cache lookup, origin forwarding, and response replay.
- `src/cache/cache-key.ts` generates stable cache keys.
- `src/cache/cache-store.ts` reads, writes, initializes, and clears the filesystem cache.
- `src/http/headers.ts` handles request and response header filtering.
- `src/types.ts` contains shared TypeScript types.

The CLI parser supports two modes:

- Server mode with `--port` and `--origin`
- Cache clearing mode with `--clear-cache`

In server mode, Express receives every request through a catch-all middleware. The request is converted into a cache key. If a matching cache file exists, Croxy reconstructs the stored response and returns it with `X-Cache: HIT`.

If no cache entry exists, Croxy forwards the request to the origin using `fetch`, captures the origin response, writes it to disk, and returns it with `X-Cache: MISS`.

Hop-by-hop HTTP headers such as `connection`, `transfer-encoding`, and `content-length` are filtered before forwarding or replaying responses. These headers describe a single network connection and should not be blindly reused by a proxy.

## Type Checking

Run the TypeScript compiler without emitting files:

```sh
bun run typecheck
```

## Current Limitations

Croxy is a learning-focused caching proxy and intentionally avoids advanced production cache behavior.

Important limitations:

- It does not implement TTL-based expiration.
- It does not honor `Cache-Control`, `ETag`, or `Expires` semantics from origin responses.
- It does not implement cache size limits or eviction.
- It does not deduplicate concurrent identical origin requests.
- It stores cache data on the local filesystem, not in Redis or another shared cache.
- It does not provide HTTPS termination for the local proxy server.

These limitations are reasonable for the scope of the project, but they are important if adapting the code for production use.

## Development Notes

Install dependencies before running local commands:

```sh
bun install
```

Start a development proxy:

```sh
bun src/index.ts --port 3000 --origin http://dummyjson.com
```

Run type checking:

```sh
bun run typecheck
```

Clear local cache files:

```sh
bun src/index.ts --clear-cache
```

## License

This project is released under the MIT License.

```txt
MIT License

Copyright (c) 2026 Croxy contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Project Inspiration

This project is inspired by the caching server project from roadmap.sh:

```txt
https://roadmap.sh/projects/caching-server
```
