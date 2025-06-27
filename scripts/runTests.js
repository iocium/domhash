#!/usr/bin/env node
/*
 * Custom test runner using Jest's programmatic API to bypass CLI wrappers.
 */
const { runCLI } = require('@jest/core');
(async () => {
  const args = process.argv.slice(2);
  const rootDir = process.cwd();
  const cliConfig = {
    runInBand: true,
    cache: false,
    ...(args.includes('--coverage') ? { coverage: true } : {}),
  };
  try {
    const { results } = await runCLI(cliConfig, [rootDir]);
    process.exit(results.success ? 0 : 1);
  } catch (err) {
    console.error('Error running tests:', err);
    process.exit(1);
  }
})();