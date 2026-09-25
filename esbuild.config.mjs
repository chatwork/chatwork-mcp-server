import { readFileSync } from 'node:fs';
import * as esbuild from 'esbuild';

/**
 * ビルド設定。
 *
 * バージョンを `--define` で埋め込むためだけに、CLI からこのファイルに移した。
 * CLI で `--define:__PACKAGE_VERSION__="\"$npm_package_version\""` と書く方式は、
 * `npm run` 以外から呼ばれて `npm_package_version` が未設定になると `""`（空文字リテラル）
 * に化ける。esbuild から見れば妥当な JS リテラルなのでビルドは成功し、
 * `serverInfo.version` だけが黙って空になる。潰したいのはまさにこの種の嘘なので、
 * `JSON.stringify(pkg.version)` で組み立てて取り違えようがなくする。
 */
const pkg = JSON.parse(
  readFileSync(new URL('./package.json', import.meta.url), 'utf8'),
);

if (typeof pkg.version !== 'string' || pkg.version === '') {
  throw new Error('package.json に version がありません');
}

/** @type {import('esbuild').BuildOptions} */
const options = {
  entryPoints: ['src/index.ts'],
  outfile: 'dist/index.js',
  bundle: true,
  minify: true,
  platform: 'node',
  format: 'esm',
  define: {
    __PACKAGE_VERSION__: JSON.stringify(pkg.version),
  },
  // JS API の既定は 'warning' で、成功時に何も出ない。CLI の既定（'info'）に揃えて
  // ビルドサイズと watch の再ビルドが見えるようにする
  logLevel: 'info',
};

if (process.argv.includes('--watch')) {
  const ctx = await esbuild.context(options);
  await ctx.watch();
} else {
  await esbuild.build(options);
}
