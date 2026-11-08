import { describe, expect, it } from 'bun:test';
import { normalizeCanonicalText, escapeCanonicalText } from '../../src/core/text';

describe('escapeCanonicalText', () => {
  it('escapes ampersands, angle brackets', () => {
    expect(escapeCanonicalText('a & b < c > d')).toBe('a &amp; b &lt; c &gt; d');
  });
});

describe('normalizeCanonicalText strict mode', () => {
  it('trims surrounding whitespace and escapes', () => {
    expect(normalizeCanonicalText('  a < b & c  ')).toBe('a &lt; b &amp; c');
  });

  it('keeps internal NBSP and multiple spaces', () => {
    expect(normalizeCanonicalText('a\u00A0b  c')).toBe('a\u00A0b  c');
  });

  it('returns empty string for whitespace-only input', () => {
    expect(normalizeCanonicalText('   ')).toBe('');
    expect(normalizeCanonicalText('\u00A0\t\n')).toBe('');
  });
});

describe('normalizeCanonicalText perceptual mode', () => {
  it('removes zero-width characters', () => {
    expect(normalizeCanonicalText('a\u200Bb\u200Cc\u200Dd\uFEFFe', true)).toBe('abcde');
  });

  it('removes bidi control characters', () => {
    expect(normalizeCanonicalText('a\u202Eb', true)).toBe('ab');
  });

  it('applies NFKC normalization (ligatures, compatibility forms)', () => {
    // U+FB03 (ffi ligature) normalizes to "ffi"
    expect(normalizeCanonicalText('o\uFB03ce', true)).toBe('office');
    // Fullwidth F normalizes to "F"
    expect(normalizeCanonicalText('\uFF26oo', true)).toBe('Foo');
  });

  it('collapses internal whitespace runs', () => {
    expect(normalizeCanonicalText('a  \t\n  b', true)).toBe('a b');
  });

  it('normalizes NBSP to a regular space via whitespace collapsing', () => {
    expect(normalizeCanonicalText('a\u00A0b', true)).toBe('a b');
  });

  it('still escapes after normalization', () => {
    expect(normalizeCanonicalText('a & b', true)).toBe('a &amp; b');
  });

  it('returns empty when only invisible characters remain', () => {
    expect(normalizeCanonicalText('\u200B\u200C\uFEFF', true)).toBe('');
  });
});
