const esbuild = require('esbuild');
const path = require('path');

const isWatch = process.argv.includes('--watch');

/** @type {import('esbuild').BuildOptions} */
const extensionConfig = {
    entryPoints: ['./src/extension.ts'],
    bundle: true,
    outfile: './dist/extension.js',
    external: ['vscode'],
    format: 'cjs',
    platform: 'node',
    target: 'node16',
    sourcemap: true,
    minify: !isWatch,
};

async function main() {
    if (isWatch) {
        const ctx = await esbuild.context(extensionConfig);
        await ctx.watch();
        console.log('[watch] Build started...');
    } else {
        await esbuild.build(extensionConfig);
        console.log('Build complete.');
    }
}

main().catch((e) => {
    console.error(e);
    process.exit(1);
});
