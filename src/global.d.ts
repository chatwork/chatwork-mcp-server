/**
 * ビルド時に esbuild の `define` で `package.json` の version に置き換わる。
 * `tsc` は `define` を知らないので、ここで型だけ宣言しておく。
 *
 * 置換を行うのは `esbuild.config.mjs`（`npm run build`）と
 * `vitest.config.ts`（`npm test`）の 2 箇所。src を直接読むテストでも
 * `createServer()` がこの値を参照するため、両方に定義が要る。
 */
declare const __PACKAGE_VERSION__: string;
