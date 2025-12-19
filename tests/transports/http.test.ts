import { afterEach, describe, expect, it, vi } from 'vitest';

import type { JellyseerrApi } from '../../src/core/jellyseerr-client.js';
import * as serverFactory from '../../src/server.js';
import { startStreamableHttpServer } from '../../src/transports/http/server.js';

const mockClient: JellyseerrApi = {
  request: vi.fn().mockResolvedValue({}),
  searchMedia: vi.fn().mockResolvedValue({}),
  requestMedia: vi.fn().mockResolvedValue({}),
  getRequest: vi.fn().mockResolvedValue({}),
  close: vi.fn(),
};

const cleanupHandlers: Array<() => Promise<void>> = [];

afterEach(async () => {
  while (cleanupHandlers.length) {
    const handler = cleanupHandlers.pop();
    if (handler) {
      await handler();
    }
  }
});

describe('Streamable HTTP transport', () => {
  it('starts an HTTP server on a random port', async () => {
    const originalCreateServer = serverFactory.createServer;
    const createServerSpy = vi.spyOn(serverFactory, 'createServer').mockImplementation((options) =>
      originalCreateServer({ ...options, client: mockClient }),
    );

    const handle = await startStreamableHttpServer({ port: 0, host: '127.0.0.1' });
    cleanupHandlers.push(handle.close);

    expect(handle.address.port).toBeGreaterThan(0);
    expect(createServerSpy).toHaveBeenCalled();
    createServerSpy.mockRestore();
  });
});
