import { defineConfig } from 'tsup';

export default defineConfig([
  // Node builds (ESM + CJS) for CLI and API
  {
    entry: ['src/index.ts', 'src/cli.ts'],
    format: ['esm', 'cjs'],
    target: 'es2020',
    // Enable code-splitting for ESM builds to share common chunks
    splitting: true,
    sourcemap: true,
    clean: true,
    dts: true,
    outDir: 'dist',
    // Minify the output for production usage
    minify: true,
    // Do not bundle node_modules for Node builds
    skipNodeModulesBundle: true,
  },
  // Browser build (ESM) for programmatic API only
  {
    entry: ['src/index.ts'],
    format: ['esm'],
    target: 'es2019',
    splitting: false,
    sourcemap: true,
    clean: false,
    // No declaration files needed for the browser bundle
    dts: false,
    outDir: 'dist/browser',
    // Minify the output for production usage
    minify: true,
    // Bundle all dependencies for browser
    skipNodeModulesBundle: false,
  },
  // UMD build for <script> tag / CDN usage
  {
    entry: ['src/index.ts'],
    format: ['iife'],
    globalName: 'domhash',
    target: 'es2019',
    splitting: false,
    sourcemap: true,
    clean: false,
    dts: false,
    outDir: 'dist/umd',
    // Minify the output for production usage
    minify: true,
    // Bundle all dependencies for browser
    skipNodeModulesBundle: false,
  }
]);