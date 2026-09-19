import {
  createServer as createHttpServer,
  type IncomingMessage,
  type Server,
  type ServerResponse,
} from 'node:http';
import {
  hostHeaderValidation,
  NodeStreamableHTTPServerTransport,
} from '@modelcontextprotocol/node';
import { chatworkApiTokenStorage } from './chatworkClient';
import { createServer } from './server';

const MCP_PATH = '/mcp';

/** DNS リバインディング保護の既定値。照合するのは送信元ではなく `Host` ヘッダの名前 */
const DEFAULT_ALLOWED_HOSTS = ['localhost', '127.0.0.1', '[::1]'];

/** `Authorization: Bearer <token>` からトークンを取り出す。無い・空なら undefined */
const bearerToken = (req: IncomingMessage): string | undefined => {
  const authorization = req.headers.authorization;
  if (!authorization?.startsWith('Bearer ')) {
    return undefined;
  }
  const token = authorization.slice('Bearer '.length).trim();
  return token === '' ? undefined : token;
};

const respondError = (
  res: ServerResponse,
  status: number,
  code: number,
  message: string,
  headers: Record<string, string> = {},
) => {
  res.writeHead(status, { 'Content-Type': 'application/json', ...headers });
  res.end(
    JSON.stringify({ jsonrpc: '2.0', error: { code, message }, id: null }),
  );
};

export interface HttpServerOptions {
  port: number;
  host: string;
  /**
   * DNS リバインディング保護で許可する `Host` ヘッダのホスト名。ポート番号は含めない。
   * 省略時はループバック（`localhost` / `127.0.0.1` / `[::1]`）のみを許可する。
   */
  allowedHosts?: string[];
}

/**
 * Streamable HTTP トランスポートで待ち受ける。
 *
 * ステートレス運用（セッション管理をしない）ため、POST 1 本ごとに MCP サーバと
 * transport を使い捨てる。このサーバは subscription も sampling も使っていないので
 * GET / SSE の常設ストリームは不要。
 */
export async function startHttpServer({
  port,
  host,
  allowedHosts,
}: HttpServerOptions): Promise<Server> {
  // port: 0 を渡された場合は listen 後に実際のポートで上書きする
  let boundPort = port;

  const allowedHostNames = allowedHosts ?? DEFAULT_ALLOWED_HOSTS;
  const validateHost = hostHeaderValidation(allowedHostNames);

  const handle = async (req: IncomingMessage, res: ServerResponse) => {
    if (new URL(req.url ?? '/', 'http://localhost').pathname !== MCP_PATH) {
      respondError(res, 404, -32601, `Not Found: use ${MCP_PATH}`);
      return;
    }

    // HTTP では CHATWORK_API_TOKEN にフォールバックしない。
    // フォールバックすると未認証の呼び出し元がサーバの環境変数のアカウントとして
    // Chatwork を操作できてしまう（Chatwork のトークンは全権限でスコープを絞れない）。
    const token = bearerToken(req);
    if (!token) {
      respondError(res, 401, -32001, 'Unauthorized: Bearer token required', {
        'WWW-Authenticate': 'Bearer realm="chatwork-mcp-server"',
      });
      return;
    }

    const server = createServer();
    const transport = new NodeStreamableHTTPServerTransport({
      sessionIdGenerator: undefined, // ステートレス運用の指定
      enableJsonResponse: true,
    });

    res.on('close', () => {
      void transport.close();
      void server.close();
    });

    await server.connect(transport);
    await chatworkApiTokenStorage.run(token, () =>
      transport.handleRequest(req, res),
    );
  };

  const httpServer = createHttpServer((req, res) => {
    // false のとき 403 は validateHost が既に返している
    if (!validateHost(req, res)) {
      return;
    }
    // validateHost はホスト名を小文字化して照合するが、transport が内部で使う
    // Host 検査はケースセンシティブ。揃えておかないと本文なしの 400 になる
    req.headers.host = req.headers.host?.toLowerCase();
    handle(req, res).catch((error: unknown) => {
      console.error(
        '[chatwork-mcp-server] リクエスト処理に失敗しました:',
        error,
      );
      if (res.headersSent) {
        res.end();
      } else {
        respondError(res, 500, -32603, 'Internal server error');
      }
    });
  });

  await new Promise<void>((resolve, reject) => {
    httpServer.once('error', reject);
    httpServer.listen(port, host, () => {
      httpServer.removeListener('error', reject);
      resolve();
    });
  });

  const address = httpServer.address();
  if (address !== null && typeof address === 'object') {
    boundPort = address.port;
  }

  console.error(
    `[chatwork-mcp-server] listening on http://${host}:${boundPort}${MCP_PATH}`,
  );
  console.error(
    `[chatwork-mcp-server] allowed Host names: ${allowedHostNames.join(', ')}`,
  );

  return httpServer;
}
