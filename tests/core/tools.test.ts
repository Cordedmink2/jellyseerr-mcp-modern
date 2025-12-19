import { describe, expect, it, vi } from 'vitest';

import type { JellyseerrApi } from '../../src/core/jellyseerr-client.js';
import { createJellyseerrTools } from '../../src/core/tools.js';

const mockClient = (): JellyseerrApi => ({
  request: vi.fn(),
  searchMedia: vi.fn().mockResolvedValue({ results: [] }),
  requestMedia: vi.fn().mockResolvedValue({ id: 1 }),
  getRequest: vi.fn().mockResolvedValue({ id: 1, status: 'pending' }),
  close: vi.fn(),
});

describe('createJellyseerrTools', () => {
  it('registers all expected tools', () => {
    const tools = createJellyseerrTools(mockClient());
    const toolNames = tools.map((tool) => tool.name);
    expect(toolNames).toEqual(
      expect.arrayContaining(['ping', 'search_media', 'request_media', 'get_request', 'raw_request']),
    );
  });

  it('routes handlers to the provided client', async () => {
    const client = mockClient();
    const tools = createJellyseerrTools(client);
    const searchTool = tools.find((tool) => tool.name === 'search_media');
    const requestTool = tools.find((tool) => tool.name === 'request_media');

    expect(searchTool).toBeDefined();
    expect(requestTool).toBeDefined();

    const searchResult = await searchTool?.handler({ query: 'Test', limit: 5 } as never, {} as never);
    const requestResult = await requestTool?.handler(
      { mediaId: 123, mediaType: 'movie', is4k: false } as never,
      {} as never,
    );

    expect(client.searchMedia).toHaveBeenCalledWith('Test', 5);
    expect(client.requestMedia).toHaveBeenCalledWith(123, 'movie', false);
    expect(searchResult?.content[0]).toMatchObject({ type: 'text' });
    expect(requestResult?.content[0]).toMatchObject({ type: 'text' });
  });
});
