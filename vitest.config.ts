import { readFileSync } from 'node:fs';
import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

// src を直接読むテストも createServer() を通るため、ビルドと同じ置換が要る
const pkg: unknown = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
);
const version = (pkg as { version?: unknown }).version;
if (typeof version !== 'string' || version === '') {
  throw new Error('package.json に version がありません');
}

export default defineConfig({
  define: {
    __PACKAGE_VERSION__: JSON.stringify(version),
  },
  test: {
    env: dotenv.config({ path: '.env.test' }).parsed ?? {},
    coverage: {
      provider: 'v8',
      // 計測対象は src のみ。smoke テストが起動する dist/index.js は
      // 子プロセスかつ minify 済みバンドルなので計測しない
      include: ['src/**/*.ts'],
      reporter: ['text', 'html', 'lcov'],
      // 実績の少し下に置き、下回ったら exit code 1 にする
      thresholds: {
        statements: 80,
        branches: 40,
        functions: 80,
        lines: 80,
      },
    },
  },
});
