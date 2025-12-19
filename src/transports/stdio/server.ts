import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio';

import { createServer } from '../../server.js';

export async function startStdioServer(): Promise<void> {
  const { server, client } = createServer({ transportName: 'stdio' });
  const transport = new StdioServerTransport();

  try {
    await server.connect(transport);
    process.on('SIGINT', async () => {
      await server.close();
      client.close();
      process.exit(0);
    });
  } catch (error) {
    await server.close();
    client.close();
    throw error;
  }
}
