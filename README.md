# Chatwork MCP Server

[![npm](https://img.shields.io/npm/v/@chatwork/mcp-server)](https://www.npmjs.com/package/@chatwork/mcp-server)

Chatwork を AI から操作するための MCP (Model Context Protocol) サーバーです。

## 使い方

### Claude Desktop

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

### Claude Code

以下のコマンドを実行してください。

```bash
claude mcp add chatwork -e CHATWORK_API_TOKEN=YOUR_CHATWORK_API_TOKEN -- npx -y @chatwork/mcp-server
```

今後、MCP に対応した AI ツールが増える可能性があります。使い方を追加してほしいツールがあった場合、あなたのコントリビュートをお待ちしています！
