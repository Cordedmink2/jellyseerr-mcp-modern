import { createServer as createHttpServer } from 'node:http';
import { randomUUID } from 'node:crypto';

import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import type { Request, Response } from 'express';

import { createServer } from '../../server.js';

export interface HttpServerOptions {
  port: number;
  host: string;
}

export interface HttpServerHandle {
  close: () => Promise<void>;
  address: { port: number; family: string; address: string };
}

export async function startStreamableHttpServer(options: HttpServerOptions): Promise<HttpServerHandle> {
  const { port, host } = options;
  const { server, client } = createServer({ transportName: 'streamable-http' });
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: () => randomUUID(),
  });

  await server.connect(transport);

  const app = createMcpExpressApp({ host });

  app.all('/mcp', async (req: Request, res: Response): Promise<void> => {
    try {
      await transport.handleRequest(req, res, req.body);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: { code: -32603, message },
          id: null,
        });
      }
    }
  });

  const httpServer = createHttpServer(app);

  await new Promise<void>((resolve, reject) => {
    httpServer.listen(port, host, () => resolve());
    httpServer.on('error', reject);
  });

  const addressInfo = httpServer.address();
  const address =
    typeof addressInfo === 'string'
      ? { port, family: 'unix', address: addressInfo }
      : { port: addressInfo?.port ?? port, family: addressInfo?.family ?? 'tcp', address: addressInfo?.address ?? host };

  const close = async (): Promise<void> => {
    await transport.close();
    await server.close();
    client.close();
    await new Promise<void>((resolve, reject) => {
      httpServer.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  };

  process.on('SIGINT', (): void => {
    void close().then(() => process.exit(0));
  });

  return { close, address };
}
