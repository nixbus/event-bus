import { build } from 'esbuild'

async function main() {
  const options = {
    entryPoints: ['./lib/nixbus.ts'],
    bundle: true,
    treeShaking: true,
    sourcemap: false,
    keepNames: true,
    minify: true,
    platform: 'neutral',
    mainFields: ['module', 'main'],
    tsconfig: './tsconfig.json',
    logLevel: 'info',
    define:
      process.env.NODE_ENV === 'production'
        ? {
            'process.env.NODE_ENV': `'${process.env.NODE_ENV}'`,
          }
        : undefined,
  }
  await Promise.all([
    build({
      ...options,
      outdir: './dist',
      format: 'esm',
    }),
    build({
      ...options,
      outdir: './dist/cjs',
      format: 'cjs',
    }),
  ])
}

main()
  .then(() => console.log('⚡ Bundle build complete ⚡'))
  .catch(() => {
    process.exit(1)
  })
