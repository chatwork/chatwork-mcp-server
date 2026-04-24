# Chatwork MCP Server

Chatwork を AI から操作するための MCP (Model Context Protocol) サーバーです。

英語版は [README_en.md](README_en.md) を参照してください。

## 使い方

Claude Desktop を例に説明します。

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

今後、MCP に対応した AI ツールが増える可能性があります。使い方を追加してほしいツールがあった場合、あなたのコントリビュートをお待ちしています！

## Docker + Codex

Docker を使って Codex から利用する場合は、以下の手順でセットアップします。

1. `.env` を作成し、Chatwork API token を設定する

```sh
cp .env.example .env
```

`.env` に `CHATWORK_API_TOKEN` を設定してください。

2. Docker イメージをビルドする

```sh
docker build -t chatwork-mcp-server .
```

3. プロジェクトローカルの Codex 設定 [`.codex/config.toml`](.codex/config.toml) を使う

```toml
[mcp_servers.chatwork]
command = "docker"
args = ["run", "--rm", "-i", "--env-file", ".env", "chatwork-mcp-server"]
```

4. このプロジェクトルートで Codex を起動する

```sh
codex
```

5. Codex をすでに開いていた場合は、新しいセッションを開始するか再起動する

6. Codex 内で `/mcp` を開き、`chatwork` が表示されることを確認する

補足:

- Codex はこの設定では `.mcp.json` ではなく `.codex/config.toml` を使います
- `docker run -d ...` で事前に常駐コンテナを起動しておく必要はありません
- `.env` はプロジェクトルートに置く前提です
