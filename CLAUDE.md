# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 開発コマンド

### ビルドとテスト

- `npm run build` - esbuildでTypeScriptを単一のESMファイルにバンドル
- `npm run dev` - ビルドをwatch モードで実行（開発時）
- `npm run test` - Vitestでテスト実行
- `npm run type-check` - TypeScript型チェック
- `npm run lint` - ESLint + Prettier チェック

### 環境設定

- プロジェクトルートに `.env.test` ファイルが必要（Vitest用）
- `CHATWORK_API_TOKEN` 環境変数が必要

## アーキテクチャ概要

### MCP サーバー実装

このプロジェクトは Chatwork API を Model Context Protocol (MCP) 経由で操作できるサーバーです。

### 主要コンポーネント

- `src/index.ts` - エントリーポイント（StdioServerTransport でMCPサーバーを起動）
- `src/server.ts` - MCPサーバー設定と全ツール定義（40個以上のChatwork操作）
- `src/chatworkClient.ts` - Chatwork API v2 クライアント実装
- `src/schema.ts` - Zod スキーマ定義（全APIエンドポイントのパラメータ検証）
- `src/toolCallbacks.ts` - 各MCPツールの実装（APIコール→レスポンス変換）

### 提供機能

- ユーザー情報（自分の情報、ステータス、タスク一覧、コンタクト一覧）
- チャット管理（作成、取得、更新、削除/退席、メンバー管理）
- メッセージ操作（一覧、投稿、既読/未読、取得、更新、削除）
- タスク管理（一覧、作成、取得、ステータス更新）
- ファイル管理（一覧、ファイル情報取得）
- 招待リンク管理（取得、作成、更新、削除）
- コンタクト承認依頼（一覧、承認、拒否）

### データフロー

1. MCP クライアント（Claude等）がツール呼び出し
2. `server.ts` でツール定義とスキーマ検証
3. `toolCallbacks.ts` でパラメータ処理
4. `chatworkClient.ts` でChatwork API v2 呼び出し
5. レスポンスをMCP形式に変換して返却

### 設定とデプロイ

- npm パッケージとして `@chatwork/mcp-server` で公開
- `dist/index.js` が実行可能バイナリ
- ES2022 modules、bundler resolution使用
- 厳密なTypeScript設定（@tsconfig/strictest）
