import { describe, expect, it } from 'bun:test';
import { domhash } from '../src/index';

/**
 * End-to-end checks that the anti-evasion options actually change the hash
 * when they should, and ignore cosmetic differences when they should.
 */

describe('includeAttributeValues (e2e)', () => {
  const good = '<html><body><a href="https://good.com/login">Sign in</a></body></html>';
  const phishing = '<html><body><a href="https://evil.com/steal">Sign in</a></body></html>';

  it('default options: destination swap does NOT change the hash', async () => {
    const a = await domhash(good);
    const b = await domhash(phishing);
    expect(a.hash).toBe(b.hash);
  });

  it('with includeAttributeValues: destination swap changes the hash', async () => {
    const opts = { includeAttributeValues: ['href'] };
    const a = await domhash(good, opts);
    const b = await domhash(phishing, opts);
    expect(a.hash).not.toBe(b.hash);
  });

  it('cosmetic URL differences do NOT change the hash when values are included', async () => {
    const opts = { includeAttributeValues: ['href'] };
    const a = await domhash(good, opts);
    const cosmetic =
      '<html><body><a href="HTTPS://GOOD.com/login#top">Sign in</a></body></html>';
    const b = await domhash(cosmetic, opts);
    expect(a.hash).toBe(b.hash);
  });

  it('script src swap changes the hash when values are included', async () => {
    const opts = { includeAttributeValues: ['src'] };
    const a = await domhash(
      '<html><body><script src="https://cdn.example.com/app.js"></script></body></html>',
      opts
    );
    const b = await domhash(
      '<html><body><script src="https://evil.example.com/app.js"></script></body></html>',
      opts
    );
    expect(a.hash).not.toBe(b.hash);
  });

  it('works through the DOM path (Element input) identically to the string path', async () => {
    // Uses linkedom (no implicit tree construction) so the tree matches the
    // fast path exactly. Browsers/jsdom insert implicit <head>/<tbody>, which
    // is covered as a documented divergence in test/core/consistency.test.ts.
    const opts = { includeAttributeValues: ['href'] };
    const fromString = await domhash(good, opts);
    const { parseHTML } = await import('linkedom');
    const { window } = parseHTML(good);
    const fromElement = await domhash(window.document.documentElement, opts);
    expect(fromElement.hash).toBe(fromString.hash);
  });
});

describe('normalizeText (e2e)', () => {
  const clean = '<html><body><p>office World</p></body></html>';
  const zws = '<html><body><p>off\u200Bice\u200B World</p></body></html>';
  // U+FB03 is the "ffi" ligature: o-\uFB03-c-e renders as "office".
  // (U+FB01 is avoided: Bun's ICU mishandles its NFKC decomposition when
  // adjacent to other characters.)
  const ligature = '<html><body><p>o\uFB03ce World</p></body></html>';
  const spaced = '<html><body><p>office   World</p></body></html>';

  it('strict mode: invisible characters and ligatures flip the hash', async () => {
    const a = await domhash(clean);
    expect((await domhash(zws)).hash).not.toBe(a.hash);
    expect((await domhash(ligature)).hash).not.toBe(a.hash);
    expect((await domhash(spaced)).hash).not.toBe(a.hash);
  });

  it('perceptual mode: visually identical pages hash the same', async () => {
    const opts = { normalizeText: true };
    const a = await domhash(clean, opts);
    expect((await domhash(zws, opts)).hash).toBe(a.hash);
    expect((await domhash(ligature, opts)).hash).toBe(a.hash);
    expect((await domhash(spaced, opts)).hash).toBe(a.hash);
  });

  it('perceptual mode still detects real content changes', async () => {
    const opts = { normalizeText: true };
    const a = await domhash(clean, opts);
    const changed = await domhash('<html><body><p>Hello World! Extra</p></body></html>', opts);
    expect(changed.hash).not.toBe(a.hash);
  });
});
