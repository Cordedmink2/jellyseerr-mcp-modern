![Jellyseerr MCP Server](header.png)

# Jellyseerr MCP Server (Node/TypeScript)

First-class MCP support for Jellyseerr across stdio, legacy SSE, and the new Streamable HTTP transport powered by `@modelcontextprotocol/sdk`.

## Features
- Streamable HTTP transport for multi-client environments (VS Code + Discord) without proxying or bridging.
- Transport-agnostic tools backed by a shared Jellyseerr API client.
- Stdio transport for CLI/desktop MCP clients.
- SSE transport preserved for legacy compatibility (deprecated).
- Container entrypoint defaults to Streamable HTTP.

## Requirements
- Node.js 18+ (Node 20 recommended)
- Jellyseerr URL and API key

## Configuration
Set environment variables (or copy `.env.example`):

```
JELLYSEERR_URL=https://your-jellyseerr.example.com
JELLYSEERR_API_KEY=your_api_key_here
JELLYSEERR_TIMEOUT=15
PORT=3000
HOST=0.0.0.0
```

## Transport comparison

| Transport | Protocol | Default | Best for | Notes |
| --- | --- | --- | --- | --- |
| Stdio | stdio | n/a | Claude Desktop, CLI | `npm run start:stdio` |
| SSE (legacy) | HTTP + SSE | `PORT` | Older MCP clients | Deprecated; endpoints `/sse` (GET) + `/messages` (POST) |
| Streamable HTTP | Streamable HTTP | `PORT` | VS Code `type: "http"`, Discord bots, multi-client | Default docker/CLI mode at `/mcp` |

## Installation

```bash
npm ci
npm run build
```

## Running

### Streamable HTTP (default)
```bash
# Uses PORT/HOST (defaults: 3000/0.0.0.0)
node dist/index.js --transport=http
```

### Stdio
```bash
node dist/index.js --transport=stdio
```

### SSE (legacy)
```bash
node dist/index.js --transport=sse
# Connect at GET /sse, POST /messages?sessionId={id}
```

### Docker
```bash
docker build -t jellyseerr-mcp .
docker run --rm -p 3000:3000 \
  -e JELLYSEERR_URL="https://your-jellyseerr.com" \
  -e JELLYSEERR_API_KEY="your_api_key" \
  jellyseerr-mcp
```

## MCP client examples

### VS Code (`type: "http"`)
```json
{
  "mcpServers": {
    "jellyseerr": {
      "type": "http",
      "url": "http://localhost:3000/mcp",
      "name": "jellyseerr"
    }
  }
}
```

### Discord bot notes
- Run the Streamable HTTP server where the bot can reach `http://<host>:<port>/mcp`.
- Reuse the same MCP session per bot instance for best tool reuse; no proxying is required.

## Exposed tools
- `ping()` — Liveness check with transport metadata.
- `search_media(query, limit?)` — Search Jellyseerr.
- `request_media(mediaId, mediaType, is4k?)` — Submit a request.
- `get_request(requestId)` — Retrieve request details.
- `raw_request(method, endpoint, params?, body?)` — Direct Jellyseerr API access.

## Development
- Lint: `npm run lint`
- Tests: `npm test`
- Build: `npm run build`

## License
MIT
