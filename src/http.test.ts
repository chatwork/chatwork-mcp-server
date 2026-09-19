import { request as httpRequest, type Server } from 'node:http';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { startHttpServer } from './http';

/** fetch はスタブするので、テスト自身の通信用に本物を確保しておく */
const realFetch = globalThis.fetch;

/** Host ヘッダを差し替えて POST する。fetch は Host を forbidden header として落とすため */
const postWithHost = (url: string, host: string) =>
  new Promise<number | undefined>((resolve, reject) => {
    const request = httpRequest(
      url,
      {
        method: 'POST',
        headers: {
          Host: host,
          Authorization: 'Bearer token-from-header',
          'Content-Type': 'application/json',
          Accept: 'application/json, text/event-stream',
        },
      },
      (response) => {
        response.resume();
        response.on('end', () => resolve(response.statusCode));
      },
    );
    request.on('error', reject);
    request.end(
      JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list' }),
    );
  });

describe('http.ts', () => {
  describe('#startHttpServer', () => {
    let httpServer: Server;
    let baseUrl: string;
    let chatworkApi: ReturnType<typeof vi.fn>;

    beforeEach(async () => {
      // フォールバックしないことを確かめるため、env 側にも別のトークンを置いておく
      vi.stubEnv('CHATWORK_API_TOKEN', 'token-from-env');

      chatworkApi = vi.fn(() =>
        Promise.resolve(new Response('{"account_id":1}', { status: 200 })),
      );
      vi.stubGlobal('fetch', chatworkApi);

      httpServer = await startHttpServer({ port: 0, host: '127.0.0.1' });
      const address = httpServer.address();
      if (address === null || typeof address !== 'object') {
        throw new Error('ポートを特定できませんでした');
      }
      baseUrl = `http://127.0.0.1:${address.port}`;
    });

    afterEach(async () => {
      vi.unstubAllGlobals();
      vi.unstubAllEnvs();
      await new Promise<void>((resolve) => httpServer.close(() => resolve()));
    });

    /** ステートレス運用なので initialize を挟まず tools/call を単発で投げる */
    const postToolCall = (headers: Record<string, string>) =>
      realFetch(`${baseUrl}/mcp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // 両方揃っていないと transport が 406 を返す
          Accept: 'application/json, text/event-stream',
          ...headers,
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: { name: 'get_me', arguments: {} },
        }),
      });

    describe('認証', () => {
      test('Bearer のトークンが tool コールバックまで伝播し Chatwork API に使われる', async () => {
        const response = await postToolCall({
          Authorization: 'Bearer token-from-header',
        });

        expect(response.status).toBe(200);
        expect(chatworkApi).toHaveBeenCalledTimes(1);

        const init = chatworkApi.mock.calls[0]?.[1] as RequestInit;
        const headers = init.headers as Record<string, string>;
        expect(headers['X-ChatWorkToken']).toBe('token-from-header');
      });

      test('Authorization が無ければ 401 で env のトークンにフォールバックしない', async () => {
        const response = await postToolCall({});

        expect(response.status).toBe(401);
        expect(response.headers.get('WWW-Authenticate')).toContain('Bearer');
        // env に token-from-env があっても Chatwork API は呼ばれない
        expect(chatworkApi).not.toHaveBeenCalled();
      });

      test('Bearer の値が空なら 401', async () => {
        const response = await postToolCall({ Authorization: 'Bearer ' });

        expect(response.status).toBe(401);
        expect(chatworkApi).not.toHaveBeenCalled();
      });
    });

    describe('ルーティング', () => {
      test('/mcp 以外のパスは 404', async () => {
        const response = await realFetch(`${baseUrl}/`, { method: 'POST' });

        expect(response.status).toBe(404);
      });
    });

    describe('DNS リバインディング保護', () => {
      test('Host ヘッダが allowedHosts と一致しなければ 403', async () => {
        const status = await postWithHost(`${baseUrl}/mcp`, 'evil.example.com');

        expect(status).toBe(403);
        expect(chatworkApi).not.toHaveBeenCalled();
      });

      test('照合はホスト名のみで行われ、ポート番号は無視される', async () => {
        await expect(
          postWithHost(`${baseUrl}/mcp`, 'localhost:59999'),
        ).resolves.toBe(200);
      });

      test('allowedHosts を渡すとループバック以外の Host も許可される', async () => {
        const server = await startHttpServer({
          port: 0,
          host: '127.0.0.1',
          allowedHosts: ['mcp.example.com'],
        });
        const address = server.address();
        if (address === null || typeof address !== 'object') {
          throw new Error('ポートを特定できませんでした');
        }
        const url = `http://127.0.0.1:${address.port}/mcp`;

        try {
          await expect(postWithHost(url, 'mcp.example.com')).resolves.toBe(200);
          // 明示指定したときは既定のループバックは含まれない
          await expect(
            postWithHost(url, `127.0.0.1:${address.port}`),
          ).resolves.toBe(403);
        } finally {
          await new Promise<void>((resolve) => server.close(() => resolve()));
        }
      });
    });
  });
});
