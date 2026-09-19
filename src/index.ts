#! /usr/bin/env node

import { parseArgs } from 'node:util';
import { StdioServerTransport } from '@modelcontextprotocol/server/stdio';
import { startHttpServer } from './http';
import { createServer } from './server';

/** `--port` / `PORT` を検証する。`listen(NaN)` はランダムなポートで無言起動してしまうため */
const parsePort = (raw: string): number => {
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 0 || port > 65535) {
    throw new Error(`ポート番号が不正です: ${raw}`);
  }
  return port;
};

/** カンマ区切りの `Host` 許可リスト。空なら undefined（= ループバックのみ） */
const parseAllowedHosts = (raw: string | undefined): string[] | undefined => {
  const hosts = (raw ?? '')
    .split(',')
    .map((host) => host.trim())
    .filter((host) => host !== '');
  return hosts.length > 0 ? hosts : undefined;
};

async function main() {
  const { values } = parseArgs({
    options: {
      transport: { type: 'string' },
      port: { type: 'string' },
      host: { type: 'string' },
      'allowed-hosts': { type: 'string' },
    },
  });

  const transport = values.transport ?? process.env['MCP_TRANSPORT'] ?? 'stdio';

  switch (transport) {
    case 'stdio':
      await createServer().connect(new StdioServerTransport());
      return;

    case 'http': {
      const allowedHosts = parseAllowedHosts(
        values['allowed-hosts'] ?? process.env['MCP_ALLOWED_HOSTS'],
      );
      await startHttpServer({
        port: parsePort(values.port ?? process.env['PORT'] ?? '3000'),
        host: values.host ?? process.env['HOST'] ?? '127.0.0.1',
        ...(allowedHosts === undefined ? {} : { allowedHosts }),
      });
      return;
    }

    default:
      throw new Error(
        `未知のトランスポートです: ${transport}（'stdio' または 'http' を指定してください）`,
      );
  }
}

main().catch((error: unknown) => {
  // stdio では stdout は JSON-RPC 専用なので stderr に出す
  console.error('[chatwork-mcp-server] 起動に失敗しました:', error);
  process.exit(1);
});
