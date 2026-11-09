import { describe, expect, it } from 'bun:test';
import { normalizeAttributeValue } from '../../src/core/attributeValues';
import { canonicalizeString } from '../../src/core/parse5Canonicalizer';

describe('normalizeAttributeValue', () => {
  it('collapses whitespace and trims', () => {
    expect(normalizeAttributeValue('  hello   world  ')).toBe('hello world');
  });

  it('returns empty string for blank values', () => {
    expect(normalizeAttributeValue('   ')).toBe('');
  });

  it('lowercases scheme and host of absolute URLs', () => {
    expect(normalizeAttributeValue('HTTPS://Evil.COM/Path')).toBe('https://evil.com/Path');
  });

  it('drops URL fragments but keeps query', () => {
    expect(normalizeAttributeValue('https://x.com/a?b=1#c')).toBe('https://x.com/a?b=1');
  });

  it('keeps path and query case (both are case-sensitive)', () => {
    expect(normalizeAttributeValue('https://x.com/A/B?C=1')).toBe('https://x.com/A/B?C=1');
  });

  it('drops credentials', () => {
    expect(normalizeAttributeValue('https://user:pass@X.com/p')).toBe('https://x.com/p');
  });

  it('keeps port and lowercases host with port', () => {
    expect(normalizeAttributeValue('https://X.com:8080/p')).toBe('https://x.com:8080/p');
  });

  it('lowercases host of protocol-relative URLs and drops fragments', () => {
    expect(normalizeAttributeValue('//X.com/a#f')).toBe('//x.com/a');
  });

  it('keeps relative URLs as written (whitespace collapsed)', () => {
    expect(normalizeAttributeValue('/rel/path?q=1')).toBe('/rel/path?q=1');
    expect(normalizeAttributeValue('./x/ y')).toBe('./x/ y');
  });

  it('keeps tildes and spaces in plain values (deterministic as written)', () => {
    expect(normalizeAttributeValue('a~b c')).toBe('a~b c');
  });
});

describe('includeAttributeValues canonicalization', () => {
  const html = '<div><a href="https://Good.COM/x?a=1#f">link</a><img src="img.png"></div>';

  it('includes normalized values only for listed attributes', () => {
    const res = canonicalizeString(html, { includeAttributeValues: ['href'] });
    expect(res.canonical).toContain('href~https://good.com/x?a=1');
    // src not listed: name only, no value
    expect(res.canonical).toContain('<img src>');
  });

  it('hashes different destinations differently', () => {
    const a = canonicalizeString(html, { includeAttributeValues: ['href'] });
    const evil = canonicalizeString(
      html.replace('Good.COM', 'EVIL.org'),
      { includeAttributeValues: ['href'] }
    );
    expect(a.canonical).not.toBe(evil.canonical);
  });

  it('is blind to destination changes by default (no option)', () => {
    const a = canonicalizeString(html);
    const evil = canonicalizeString(html.replace('Good.COM', 'EVIL.org'));
    expect(a.canonical).toBe(evil.canonical);
  });

  it('treats host case and fragment differences as cosmetic', () => {
    const a = canonicalizeString(html, { includeAttributeValues: ['href'] });
    const cosmetic = canonicalizeString(
      html.replace('https://Good.COM/x?a=1#f', 'https://good.com/x?a=1#other'),
      { includeAttributeValues: ['href'] }
    );
    expect(a.canonical).toBe(cosmetic.canonical);
  });

  it('respects the includeAttributes allowlist (value only if name included)', () => {
    const res = canonicalizeString(html, {
      includeAttributes: ['src'],
      includeAttributeValues: ['href', 'src'],
    });
    // href excluded by allowlist: not present at all, so no value either
    expect(res.canonical).not.toContain('href');
    expect(res.canonical).toContain('<img src~img.png>');
  });
});
