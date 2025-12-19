import { createServer as createHttpServer } from 'node:http';

import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { createMcpExpressApp } from '@modelcontextprotocol/sdk/server/express.js';
import type { Request, Response } from 'express';

import { createServer } from '../../server.js';

interface TransportSession {
  transport: SSEServerTransport;
  close: () => Promise<void>;
}

export async function startSseServer(port: number, host: string): Promise<void> {
  const app = createMcpExpressApp({ host });
  const transports = new Map<string, TransportSession>();

  app.get('/sse', async (_req: Request, res: Response): Promise<void> => {
    try {
      const { server, client } = createServer({ transportName: 'sse' });
      const transport = new SSEServerTransport('/messages', res);
      const sessionId = transport.sessionId;

      transport.onclose = async () => {
        transports.delete(sessionId);
        await server.close();
        client.close();
      };

      transports.set(sessionId, {
        transport,
        close: async () => {
          await transport.close();
          await server.close();
          client.close();
        },
      });

      await server.connect(transport);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (!res.headersSent) {
        res.status(500).send(message);
      }
    }
  });

  app.post('/messages', async (req: Request, res: Response): Promise<void> => {
    const sessionIdParam = req.query.sessionId;
    if (typeof sessionIdParam !== 'string') {
      res.status(400).send('Missing sessionId parameter');
      return;
    }

    const sessionId = sessionIdParam;
    const entry = transports.get(sessionId);
    if (!entry) {
      res.status(404).send('Session not found');
      return;
    }

    try {
      await entry.transport.handlePostMessage(req, res, req.body);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      if (!res.headersSent) {
        res.status(500).send(message);
      }
    }
  });

  const httpServer = createHttpServer(app);

  await new Promise<void>((resolve, reject) => {
    httpServer.listen(port, host, () => resolve());
    httpServer.on('error', reject);
  });

  const shutdown = async (): Promise<void> => {
    await Promise.all(
      Array.from(transports.values()).map(async (entry) => {
        await entry.close();
      }),
    );
    await new Promise<void>((resolve, reject) => {
      httpServer.close((error) => {
        if (error) reject(error);
        else resolve();
      });
    });
  };

  process.on('SIGINT', (): void => {
    void shutdown().then(() => process.exit(0));
  });
}
