import type { AnySchema, ZodRawShapeCompat } from '@modelcontextprotocol/sdk/server/zod-compat';
import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol';
import type { CallToolResult, ServerNotification, ServerRequest } from '@modelcontextprotocol/sdk/types';
import { z } from 'zod';

import type { JellyseerrApi } from './jellyseerr-client.js';
import {
  getRequestInputSchema,
  pingOutputSchema,
  rawRequestInputSchema,
  requestMediaInputSchema,
  searchMediaInputSchema,
} from './schemas.js';

export interface JellyseerrTool {
  name: string;
  description: string;
  inputSchema?: ZodRawShapeCompat | AnySchema;
  outputSchema?: AnySchema;
  handler: (
    args: any,
    extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
  ) => Promise<CallToolResult>;
}

function formatContent(data: unknown): CallToolResult {
  return {
    content: [
      {
        type: 'text',
        text: typeof data === 'string' ? data : JSON.stringify(data, null, 2),
      },
    ],
  };
}

export function createJellyseerrTools(client: JellyseerrApi, transportName = 'mcp'): JellyseerrTool[] {
  const tools: JellyseerrTool[] = [
    {
      name: 'ping',
      description: 'Simple liveness check with transport info.',
      outputSchema: pingOutputSchema,
      handler: async (
        _args: unknown,
        _extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
      ): Promise<CallToolResult> =>
        formatContent({
          ok: true,
          service: 'jellyseerr-mcp',
          transport: transportName,
        }),
    },
    {
      name: 'search_media',
      description: 'Search Jellyseerr for media by text query.',
      inputSchema: searchMediaInputSchema.shape,
      handler: async (
        args: any,
        _extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
      ): Promise<CallToolResult> => {
        const data = await client.searchMedia(args.query, args.limit);
        return formatContent(data);
      },
    },
    {
      name: 'request_media',
      description: 'Create a media request in Jellyseerr.',
      inputSchema: requestMediaInputSchema.shape,
      handler: async (
        args: any,
        _extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
      ): Promise<CallToolResult> => {
        const data = await client.requestMedia(args.mediaId, args.mediaType, args.is4k);
        return formatContent(data);
      },
    },
    {
      name: 'get_request',
      description: 'Get Jellyseerr request details/status by id.',
      inputSchema: getRequestInputSchema.shape,
      handler: async (
        args: any,
        _extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
      ): Promise<CallToolResult> => {
        const data = await client.getRequest(args.requestId);
        return formatContent(data);
      },
    },
    {
      name: 'raw_request',
      description: 'Advanced: call any Jellyseerr endpoint. Use with caution.',
      inputSchema: rawRequestInputSchema.shape,
      outputSchema: z.any(),
      handler: async (
        args: any,
        _extra: RequestHandlerExtra<ServerRequest, ServerNotification>,
      ): Promise<CallToolResult> => {
        const data = await client.request(args.method, args.endpoint, args.params, args.body);
        return formatContent(data);
      },
    },
  ];

  return tools;
}
