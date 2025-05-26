import { hashStructure } from '../../src/core/hasher';
import murmurhash3 from '../../src/core/murmur3';
import { blake3 } from '@noble/hashes/blake3';
import { createHash } from 'crypto';

describe('hashStructure', () => {
  it('computes sha256 hash correctly', async () => {
    const text = 'hello';
    const expected = createHash('sha256').update(text).digest('hex');
    const result = await hashStructure(text, 'sha256');
    expect(result).toBe(expected);
  });

  it('computes murmur3 hash correctly', async () => {
    const text = 'test';
    const expected = murmurhash3(text).toString(16).padStart(8, '0');
    const result = await hashStructure(text, 'murmur3');
    expect(result).toBe(expected);
  });

  it('computes blake3 hash correctly', async () => {
    const text = 'abc';
    const data = new TextEncoder().encode(text);
    const expected = blake3(data).reduce((str, b) => str + b.toString(16).padStart(2, '0'), '');
    const result = await hashStructure(text, 'blake3');
    expect(result).toBe(expected);
  });

  it('computes simhash hash correctly', async () => {
    const text = 'abc';
    
    const bits = new Array(32).fill(0);
    for (const char of text) {
      const h = murmurhash3(char);
      for (let i = 0; i < 32; i++) {
        bits[i] += ((h >> i) & 1) ? 1 : -1;
      }
    }
    const expectedNum = bits.reduce((acc, v, i) => acc | ((v > 0 ? 1 : 0) << i), 0) >>> 0;
    const expected = expectedNum.toString(16);
    const result = await hashStructure(text, 'simhash');
    expect(result).toBe(expected);
  });

  it('computes minhash hash correctly', async () => {
    const text = 'abcdefg';
    const k = 4;
    const hashes: number[] = [];
    for (let i = 0; i <= text.length - k; i++) {
      hashes.push(murmurhash3(text.slice(i, i + k)));
    }
    const expectedNum = Math.min(...hashes);
    const expected = expectedNum.toString(16);
    const result = await hashStructure(text, 'minhash');
    expect(result).toBe(expected);
  });
});