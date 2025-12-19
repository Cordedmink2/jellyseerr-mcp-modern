import { startStreamableHttpServer } from './transports/http/server.js';
import { startSseServer } from './transports/sse/server.js';
import { startStdioServer } from './transports/stdio/server.js';

interface CliOptions {
  transport: 'stdio' | 'sse' | 'http';
  port: number;
  host: string;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const transportArg = args.find((arg) => arg.startsWith('--transport='));
  const portArg = args.find((arg) => arg.startsWith('--port='));
  const hostArg = args.find((arg) => arg.startsWith('--host='));

  const transport =
    (transportArg?.split('=')[1] as CliOptions['transport'] | undefined) ??
    (process.env.TRANSPORT as CliOptions['transport']) ??
    'http';

  const port = Number(portArg?.split('=')[1] || process.env.PORT || 3000);
  const host = hostArg?.split('=')[1] || process.env.HOST || '0.0.0.0';

  if (!['stdio', 'sse', 'http'].includes(transport)) {
    throw new Error(`Unsupported transport: ${transport}`);
  }

  return { transport: transport as CliOptions['transport'], port, host };
}

async function main(): Promise<void> {
  const options = parseArgs();

  if (options.transport === 'stdio') {
    await startStdioServer();
    return;
  }

  if (options.transport === 'sse') {
    await startSseServer(options.port, options.host);
    return;
  }

  await startStreamableHttpServer({ port: options.port, host: options.host });
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
