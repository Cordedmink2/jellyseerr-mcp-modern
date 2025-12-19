import { McpServer } from '@modelcontextprotocol/sdk/server/mcp';
import { z } from 'zod';

import { loadConfig } from './core/config.js';
import { JellyseerrClient, type JellyseerrApi } from './core/jellyseerr-client.js';
import { createJellyseerrTools } from './core/tools.js';
import pkg from '../package.json';

export interface ServerContext {
  server: McpServer;
  client: JellyseerrApi;
}

interface CreateServerOptions {
  client?: JellyseerrApi;
  transportName?: string;
}

export function createServer(options?: CreateServerOptions): ServerContext {
  const client = options?.client ?? new JellyseerrClient(loadConfig());
  const server = new McpServer(
    {
      name: 'jellyseerr-mcp',
      version: pkg.version || '0.0.0',
    },
    {
      capabilities: { logging: {} },
    },
  );

  const tools = createJellyseerrTools(client, options?.transportName);
  tools.forEach((tool) => {
    server.registerTool(
      tool.name,
      {
        description: tool.description,
        inputSchema: tool.inputSchema,
        outputSchema: tool.outputSchema ?? z.any(),
      },
      tool.handler as any,
    );
  });

  return { server, client };
}
