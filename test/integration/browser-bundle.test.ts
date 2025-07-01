import fs from 'fs';
import vm from 'vm';
import path from 'path';
import { JSDOM } from 'jsdom';
import { TextEncoder, TextDecoder } from 'util';
import { webcrypto } from 'crypto';

describe('Browser UMD bundle integration', () => {
  it('loads and runs domhash in a browser-like VM', async () => {
    // Load the UMD bundle
    const bundlePath = path.resolve(__dirname, '../../dist/umd/index.global.js');
    const code = fs.readFileSync(bundlePath, 'utf-8');
    // Create a JSDOM window
    const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`, { runScripts: 'outside-only' });
    const { window } = dom;
    // Polyfill TextEncoder/TextDecoder and Web Crypto
    const anyWindow = window as any;
    anyWindow.TextEncoder = TextEncoder;
    anyWindow.TextDecoder = TextDecoder;
    // Provide Web Crypto API
    if (!anyWindow.crypto) {
      anyWindow.crypto = webcrypto;
    }
    // Run the bundle code in the window context
    // Use runInNewContext with the jsdom window as the sandbox
    vm.runInNewContext(code, window as any);
    // Ensure bundle global is defined
    const bundle = (window as any).domhash;
    // UMD bundle exports an object with named exports
    expect(typeof bundle).toBe('object');
    expect(typeof bundle.domhash).toBe('function');
    // Execute domhash from the bundle
    // Use murmur3 algorithm to avoid requiring Web Crypto in this VM
    const result = await bundle.domhash(
      '<div><span>Hello</span></div>',
      { resilience: true, algorithm: 'murmur3' }
    );
    expect(result).toHaveProperty('resilienceScore', 1);
    expect(result).toHaveProperty('resilienceLabel', 'Strong');
  });
});