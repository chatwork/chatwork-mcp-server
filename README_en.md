# Chatwork MCP Server

For the Japanese version of this guide, see [README.md](README.md).

Chatwork MCP (Model Context Protocol) server for operating Chatwork from AI tools.

## Usage

The following example uses Claude Desktop.

1. Start Claude Desktop
2. Click "Settings" from the menu
3. Click the "Developer" tab
4. Click "Edit Config"
5. When `claude_desktop_config.json` opens in your editor, update it with the following
6. Add this configuration

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

As more AI tools add MCP support, we may add more usage examples here.

## Docker + Codex

To use this server from Codex with Docker, set it up as follows.

1. Create `.env` and set your Chatwork API token

```sh
cp .env.example .env
```

Set `CHATWORK_API_TOKEN` in `.env`.

2. Build the Docker image

```sh
docker build -t chatwork-mcp-server .
```

3. Use the project-local Codex configuration in [`.codex/config.toml`](.codex/config.toml)

```toml
[mcp_servers.chatwork]
command = "docker"
args = ["run", "--rm", "-i", "--env-file", ".env", "chatwork-mcp-server"]
```

4. Start Codex from this project root

```sh
codex
```

5. If Codex was already open, start a new session or restart it

6. Open `/mcp` in Codex and confirm that `chatwork` is listed

Notes:

- For this setup, Codex uses `.codex/config.toml`, not `.mcp.json`
- You do not need to start a long-running container with `docker run -d ...` in advance
- `.env` is expected to exist at the project root
