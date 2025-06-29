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
    ...(args.includes('--verbose') ? { verbose: true } : {}),
  };
  try {
    const { results } = await runCLI(cliConfig, [rootDir]);
    process.exitCode = results.success ? 0 : 1;
  } catch (err) {
    // Print errors to stdout for visibility
    console.log('Error running tests:', err);
    process.exitCode = 1;
  }
})();