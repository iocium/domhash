#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { domhash, parseInput, canonicalize, hashStructure } = require('../dist/index.js');

// Helper to format BigInt nanoseconds to milliseconds
function ms(nanoseconds) {
  return Number(nanoseconds) / 1e6;
}

(async () => {
  const htmlPath = path.resolve(__dirname, '../demo/index.html');
  if (!fs.existsSync(htmlPath)) {
    console.error('Demo HTML not found at', htmlPath);
    process.exit(1);
  }
  const html = fs.readFileSync(htmlPath, 'utf8');
  console.log('Benchmarking with demo/index.html (size:', html.length, 'bytes)');

  // End-to-end domhash
  const runsFull = 100;
  console.log(`Running domhash end-to-end ${runsFull} iterations...`);
  let t0 = process.hrtime.bigint();
  for (let i = 0; i < runsFull; i++) {
    await domhash(html);
  }
  let t1 = process.hrtime.bigint();
  console.log(`Full domhash: total ${ms(t1 - t0).toFixed(2)}ms, avg ${(ms(t1 - t0) / runsFull).toFixed(3)}ms`);

  // Prepare DOM once
  const root = await parseInput(html);

  // Canonicalize only
  const runsCan = 1000;
  console.log(`Running canonicalize only ${runsCan} iterations...`);
  t0 = process.hrtime.bigint();
  for (let i = 0; i < runsCan; i++) {
    canonicalize(root);
  }
  t1 = process.hrtime.bigint();
  console.log(`canonicalize: total ${ms(t1 - t0).toFixed(2)}ms, avg ${(ms(t1 - t0) / runsCan).toFixed(3)}ms`);

  // Hashing only (sha256)
  const parts = canonicalize(root);
  const input = parts.canonical;
  const runsHash = 1000;
  console.log(`Running hashStructure only (sha256) ${runsHash} iterations...`);
  t0 = process.hrtime.bigint();
  for (let i = 0; i < runsHash; i++) {
    // sync hashing via async call
    await hashStructure(input);
  }
  t1 = process.hrtime.bigint();
  console.log(`hashStructure: total ${ms(t1 - t0).toFixed(2)}ms, avg ${(ms(t1 - t0) / runsHash).toFixed(3)}ms`);
})().catch(err => {
  console.error(err);
  process.exit(1);
});