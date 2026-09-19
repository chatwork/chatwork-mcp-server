import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  getDefaultEnvironment,
  StdioClientTransport,
} from '@modelcontextprotocol/client/stdio';
import { Client } from '@modelcontextprotocol/client';
import { describe, expect, test } from 'vitest';

/**
 * ビルド済みバイナリのスモークテスト。
 *
 * ユニットテスト（`http.test.ts` 等）が src を直接読むのに対し、ここは MCP クライアントの
 * 設定が指す `dist/index.js` そのものを子プロセスとして起動し、実際に MCP として喋れるかを見る。
 * バンドルの取りこぼし（esbuild の external 化ミス等）は src のテストでは捕まらないため。
 */
const DIST = fileURLToPath(new URL('../dist/index.js', import.meta.url));

/** dist に埋め込まれているはずの version。`__PACKAGE_VERSION__` は dist 側の定数なのでここでは使えない */
const packageVersion: string = (
  JSON.parse(
    readFileSync(new URL('../package.json', import.meta.url), 'utf8'),
  ) as { version: string }
).version;

/** dist を stdio で起動して MCP クライアントを繋ぐ。呼び出し側は必ず close すること */
const connect = async (env: Record<string, string> = {}) => {
  const client = new Client({ name: 'smoke-test', version: '0' });
  await client.connect(
    new StdioClientTransport({
      command: process.execPath,
      args: [DIST],
      // StdioClientTransport は process.env を子に渡さず getDefaultEnvironment() で
      // 絞り込む。トークンを渡したいときは明示的に足す必要がある
      env: { ...getDefaultEnvironment(), ...env },
    }),
  );
  return client;
};

// CI (check.yaml) は npm i のあと npm test を回すだけでビルドしないので、dist が無ければ飛ばす
const skipWithoutDist = !existsSync(DIST);

// 対象がバンドル済みバイナリなので、関数の層には呼び出す MCP メソッドを置いている
describe.skipIf(skipWithoutDist)('dist/index.js', () => {
  describe('#tools/list', () => {
    test('stdio で起動し MCP サーバーとしてツール一覧を返す', async () => {
      const client = await connect();
      try {
        expect(client.getServerVersion()?.name).toBe('Chatwork');

        // ハードコードした値と比べると、埋め込みの失敗と定数の更新漏れを区別できない
        expect(client.getServerVersion()?.version).toBe(packageVersion);

        const { tools } = await client.listTools();
        const names = tools.map((tool) => tool.name);

        // 個数で固定するとツールを1つ足すたびに落ちるので、代表的なものの有無だけ見る
        expect(names).toContain('get_me');
        expect(names).toContain('list_rooms');
        expect(names).toContain('post_room_message');

        // title はクライアントの承認 UI に出るので、付け忘れたツールがあれば名前で分かるようにする
        const withoutTitle = tools
          .filter((tool) => !tool.title)
          .map((tool) => tool.name);
        expect(withoutTitle).toEqual([]);
      } finally {
        await client.close();
      }
    });
  });

  /**
   * 実 API を叩くのでフラグで明示的に有効化したときだけ動かす。
   * 有効にするには `.env.test`（git 管理外）に次の2つを書いて `npm test` を実行する。
   *
   *   CHATWORK_API_TOKEN=<実トークン>
   *   CHATWORK_SMOKE_REAL_API=1
   *
   * なお `vitest.config.ts` が `.env.test` の値を `test.env` に流し込むため、
   * `.env.test` に CHATWORK_API_TOKEN があるとシェルで渡した値は上書きされる。
   */
  describe('#tools/call', () => {
    const token = process.env['CHATWORK_API_TOKEN'];
    const skipWithoutRealApi =
      process.env['CHATWORK_SMOKE_REAL_API'] === undefined ||
      token === undefined;

    test.skipIf(skipWithoutRealApi)(
      '実トークンで get_me が Chatwork API まで到達する',
      async () => {
        const client = await connect({ CHATWORK_API_TOKEN: token ?? '' });
        try {
          const result = await client.callTool({
            name: 'get_me',
            arguments: {},
          });

          expect(result.isError).toBeFalsy();

          const content = result.content as { type: string; text: string }[];
          const first = content[0];
          expect(first?.type).toBe('text');

          // レスポンスは氏名・メールを含むので、値は出さずキーの存在だけ確かめる
          const payload: unknown = JSON.parse(first?.text ?? '{}');
          expect(payload).toHaveProperty('account_id');
        } finally {
          await client.close();
        }
      },
    );
  });
});
