#!/usr/bin/env node
const inspector = require('inspector');
const fs = require('fs');
const path = require('path');

(async () => {
  const { domhash } = require(path.resolve(__dirname, '../dist/index.js'));
  const htmlPath = path.resolve(__dirname, '../demo/index.html');
  if (!fs.existsSync(htmlPath)) {
    console.error('Demo HTML not found at', htmlPath);
    process.exit(1);
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  const session = new inspector.Session();
  session.connect();
  await new Promise((res, rej) => session.post('Profiler.enable', err => err ? rej(err) : res()));
  await new Promise((res, rej) => session.post('Profiler.start', err => err ? rej(err) : res()));
  // Warmup run
  await domhash(html);
  // Profile runs (override via PROFILE_ITERATIONS env var)
  const iterations = Number(process.env.PROFILE_ITERATIONS) || 100;
  for (let i = 0; i < iterations; i++) {
    await domhash(html);
  }
  const { profile } = await new Promise((res, rej) =>
    session.post('Profiler.stop', (err, result) => err ? rej(err) : res(result))
  );
  session.disconnect();
  const outPath = path.resolve(__dirname, '../profile.cpuprofile');
  fs.writeFileSync(outPath, JSON.stringify(profile));
  console.log(`Wrote CPU profile for ${iterations} runs to ${outPath}`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});