# Chatwork MCP Server

[![npm](https://img.shields.io/npm/v/@chatwork/mcp-server)](https://www.npmjs.com/package/@chatwork/mcp-server)

Chatwork を AI から操作するための MCP (Model Context Protocol) サーバーです。

## できること

Chatwork API v2 の操作を 31 個のツールとして公開しています。

| カテゴリ           | ツール                                                                                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 自分の情報         | `get_me` / `get_my_status` / `list_my_tasks` / `list_contacts`                                                                                                 |
| チャット           | `list_rooms` / `create_room` / `get_room` / `update_room` / `delete_or_leave_room`                                                                             |
| メンバー           | `list_room_members` / `update_room_members`                                                                                                                    |
| メッセージ         | `list_room_messages` / `post_room_message` / `read_room_messages` / `unread_room_message` / `get_room_message` / `update_room_message` / `delete_room_message` |
| タスク             | `list_room_tasks` / `create_room_task` / `get_room_task` / `update_room_task_status`                                                                           |
| ファイル           | `list_room_files` / `get_room_file`                                                                                                                            |
| 招待リンク         | `get_room_link` / `create_room_link` / `update_room_link` / `delete_room_link`                                                                                 |
| コンタクト承認依頼 | `list_incoming_requests` / `accept_incoming_request` / `reject_incoming_request`                                                                               |

## 前提

- Node.js 22（CI が想定しているバージョン）
- Chatwork の API トークン（発行方法は [Chatwork API のドキュメント](https://developer.chatwork.com/docs/getting-started) を参照）

## セットアップ

### Claude Desktop

1. Claude Desktop を起動
2. メニューから「設定」をクリック
3. 「開発者」タブをクリック
4. 「構成を編集」をクリック
5. ファイルビューワーで `claude_desktop_config.json` が示されるので、好みのエディタで開く
6. 以下の設定を入力する

```json
{
  "mcpServers": {
    "chatwork": {
      "command": "npx",
      "args": ["@chatwork/mcp-server"],
      "env": {
        "CHATWORK_API_TOKEN": "YOUR_CHATWORK_API_TOKEN"
      }
    }
  }
}
```

### Claude Code

以下のコマンドを実行してください。

```bash
claude mcp add chatwork -e CHATWORK_API_TOKEN=YOUR_CHATWORK_API_TOKEN -- npx -y @chatwork/mcp-server
```

## トランスポート

既定は stdio です。上記の設定例はいずれも stdio で動作するため、変更は不要です。

### Streamable HTTP

サーバを 1 箇所に立てて複数の利用者から使いたい場合は、Streamable HTTP で起動できます。

```bash
npx @chatwork/mcp-server --transport http --port 3000
```

stdio と違い、クライアントがサーバを起動することはありません。**接続する前に自分で起動しておく必要があります。**

| フラグ            | 環境変数            | 既定値                      | 備考                                              |
| ----------------- | ------------------- | --------------------------- | ------------------------------------------------- |
| `--transport`     | `MCP_TRANSPORT`     | `stdio`                     | `stdio` または `http`                             |
| `--port`          | `PORT`              | `3000`                      |                                                   |
| `--host`          | `HOST`              | `127.0.0.1`                 |                                                   |
| `--allowed-hosts` | `MCP_ALLOWED_HOSTS` | `localhost,127.0.0.1,[::1]` | `Host` ヘッダの許可リスト。既定はループバックのみ |

`--allowed-hosts` は**ホスト名だけ**を照合します。ポート番号は指定しても無視され、
起動時に stderr へ警告を出します（`localhost:3000` は `localhost` として扱われます）。
IPv6 アドレスは角括弧付きで指定してください（`[::1]`）。

エンドポイントは `POST /mcp` です。**API トークンは環境変数ではなくリクエストヘッダで渡します。**

```
Authorization: Bearer YOUR_CHATWORK_API_TOKEN
```

ヘッダが無い場合は `401` を返します。stdio モードと違い、`CHATWORK_API_TOKEN`
環境変数へのフォールバックは**行いません**（サーバの環境変数のアカウントとして
第三者に操作されるのを防ぐため）。

## 開発

```bash
git clone https://github.com/chatwork/chatwork-mcp-server.git
cd chatwork-mcp-server
npm ci
```

| コマンド             | 内容                                            |
| -------------------- | ----------------------------------------------- |
| `npm run build`      | esbuild で `dist/index.js` にバンドルする       |
| `npm run dev`        | ビルドを watch モードで実行する                 |
| `npm test`           | Vitest でテストを実行する（`.env.test` が必要） |
| `npm run type-check` | TypeScript の型チェック                         |
| `npm run lint`       | ESLint + Prettier のチェック                    |

### Streamable HTTPでの起動する

```bash
npm run start:http                   # 127.0.0.1:3000 で待ち受ける
npm run start:http -- --port 3001    # 追加のフラグは -- の後ろに書く
```

### MCP Inspectorで動作確認する

`inspector.example.json` をコピーしてトークンを書き込み、`npm run inspect` で起動します。

```bash
cp inspector.example.json inspector.json    # Authorization の値を自分のトークンに書き換える
npm run inspect
```

サーバは別のターミナルで起動しておく必要があります。`--port` を変えた場合は
`inspector.json` の `url` も合わせて変更してください。

Inspector の設定でヘッダを渡さずに接続すると、`401` に付く `WWW-Authenticate: Bearer` を
OAuth のチャレンジと解釈して OAuth フローに入り、接続に失敗します。
このサーバは OAuth に対応していないため、必ずヘッダで渡してください。

CLI モードから叩く場合は次のようにします。

```bash
npx @modelcontextprotocol/inspector --cli --config ./inspector.json \
  --server chatwork-http --method tools/list
```

## コントリビュート

今後、MCP に対応した AI ツールが増える可能性があります。使い方を追加してほしいツールがあった場合、あなたのコントリビュートをお待ちしています！

バグ報告・要望は [Issues](https://github.com/chatwork/chatwork-mcp-server/issues) へお願いします。

## ライセンス

MIT
