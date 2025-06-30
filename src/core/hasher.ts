import murmurhash3 from './murmur3';
import { blake3 } from '@noble/hashes/blake3';

// Cache Node.js crypto and TextEncoder implementations at load time
// Detect Node.js environment for conditional imports
const isNode: boolean =
  typeof process !== 'undefined' &&
  process.versions != null &&
  typeof process.versions.node === 'string';
// Cache Node.js crypto and TextEncoder implementations when in Node.js
let nodeCreateHash: ((algorithm: string) => import('crypto').Hash) | null = null;
let NodeTextEncoder: typeof TextEncoder | null = null;
if (isNode) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const crypto = require('crypto');
  nodeCreateHash = crypto.createHash;
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const util = require('util');
  NodeTextEncoder = util.TextEncoder || null;
}

export async function hashStructure(input: string, algo: 'sha256' | 'murmur3' | 'blake3' | 'simhash' | 'minhash' = 'sha256'): Promise<string> {
  // Fast path for string-based hashes that don't require encoding
  switch (algo) {
    case 'murmur3':
      return murmurhash3(input).toString(16).padStart(8, '0');
    case 'simhash':
      return simhash(input).toString(16);
    case 'minhash':
      return minhash(input).toString(16);
  }

  // Other algorithms require byte encoding
  let Encoder: typeof TextEncoder;
  if (typeof globalThis.TextEncoder !== 'undefined') {
    Encoder = globalThis.TextEncoder;
  } else if (NodeTextEncoder) {
    Encoder = NodeTextEncoder;
  } else {
    throw new Error('TextEncoder is not available in this environment');
  }
  const data = new Encoder().encode(input);

  switch (algo) {
    case 'blake3':
      return blake3(data).reduce((str, b) => str + b.toString(16).padStart(2, '0'), '');
    case 'sha256':
    default:
      // prefer Node.js crypto if available
      if (nodeCreateHash) {
        return nodeCreateHash('sha256').update(input, 'utf8').digest('hex');
      } else if (globalThis.crypto?.subtle) {
        const hash = await crypto.subtle.digest('SHA-256', data);
        return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, '0')).join('');
      }
      throw new Error('SHA-256 hashing is not available in this environment');
  }
}

function simhash(text: string): number {
  const bits = new Array(32).fill(0);
  for (const char of text) {
    const hash = murmurhash3(char);
    for (let i = 0; i < 32; i++) {
      bits[i] += (hash >> i) & 1 ? 1 : -1;
    }
  }
  return bits.reduce((acc, val, i) => acc | ((val > 0 ? 1 : 0) << i), 0) >>> 0;
}

function minhash(text: string, k = 4): number {
  const hashes = new Set<number>();
  for (let i = 0; i <= text.length - k; i++) {
    const shingle = text.slice(i, i + k);
    hashes.add(murmurhash3(shingle));
  }
  return Math.min(...hashes);
}