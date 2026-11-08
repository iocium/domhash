import { describe, expect, it } from 'bun:test';
import { canonicalizeString } from '../../src/core/htmlparser2Canonicalizer';
import { canonicalize } from '../../src/core/canonicalizer';
import { parseHTML } from 'linkedom';
import { JSDOM } from 'jsdom';

/**
 * The string fast path (htmlparser2) and the DOM path (Element traversal)
 * must produce identical canonical output for the same document, no matter
 * which DOM implementation built the tree. These cases are regression tests
 * for historical divergences: entity-adjacent spaces, NBSP handling,
 * control whitespace, and parser-specific text-node splitting.
 */

const WRAP = (c: string) => `<!doctype html><html><head></head><body>${c}</body></html>`;

const CASES: string[] = [
  '<div>plain text</div>',
  '<div>a &amp; b</div>',
  '<div>&lt;tag&gt;</div>',
  '<div>&quot;quoted&quot;</div>',
  "<div>&#x27;apos&#x27;</div>",
  '<div>&#39;num&#39;</div>',
  '<div>&unknown;ent</div>',
  '<div>n&nb</div>',
  '<div>café</div>',
  '<div>\u00A0nbsp char</div>',
  '<div>\u200Bzero\u200Bwidth</div>',
  '<div>\uFB01i lig</div>',
  '<div>\r\n\t mixed   ws</div>',
  '<div>  spaced  </div>',
  '<div>a  b</div>',
  '<div>   </div>',
  '<div title="a&amp;b" data-x="1" class="UP">t</div>',
  '<div><!-- c --><p>x</p></div>',
  '<div><br></div>',
  '<div><img src="a.png" /></div>',
  '<div><input type="text" /></div>',
  '<DIV><Span>t</sPaN></div>',
  '<div><script>var a = 1;</script></div>',
  '<div><style>.a{color:red}</style></div>',
  '<div attr></div>',
  '<div a b="v">t</div>',
  '<div>x&amp;<span>y</span></div>',
  '<div>text&nbsp;more</div>',
  '<p>one</p><p>two</p>',
  '<div><a href="https://X.com/a?b=1#c">l</a></div>',
  '<div><a href="rel/path?q=1">l</a></div>',
];

// Table markup: browsers/jsdom insert an implicit <tbody> (see the documented
// divergence test below), but linkedom — like the htmlparser2 fast path —
// performs no tree construction, so it is included in the linkedom battery.
const TABLE_CASE = '<div><table><tr><td>c</td></tr></table></div>';

describe('fast path vs DOM path consistency', () => {
  it('produces identical canonical output across all regression cases (linkedom DOM)', () => {
    for (const c of [...CASES, TABLE_CASE]) {
      const full = WRAP(c);
      const fast = canonicalizeString(full);
      const { window } = parseHTML(full);
      const slow = canonicalize(window.document.documentElement);
      expect(slow.canonical, `linkedom: ${c}`).toBe(fast.canonical);
      expect(slow.shape, `linkedom: ${c}`).toEqual(fast.shape);
      expect(slow.tagCount).toBe(fast.tagCount);
      expect(slow.depth).toBe(fast.depth);
    }
  });

  it('produces identical canonical output across all regression cases (jsdom DOM)', () => {
    // jsdom implements spec-compliant implicit tree construction, so cases
    // that rely on it (e.g. <tbody> insertion in tables) are covered by a
    // separate documented-divergence test below.
    const { window } = new JSDOM(WRAP('<div></div>'));
    const parser = new window.DOMParser();
    for (const c of CASES) {
      const full = WRAP(c);
      const fast = canonicalizeString(full);
      const doc = parser.parseFromString(full, 'text/html');
      const slow = canonicalize(doc.documentElement);
      expect(slow.canonical, `jsdom: ${c}`).toBe(fast.canonical);
      expect(slow.shape, `jsdom: ${c}`).toEqual(fast.shape);
      expect(slow.tagCount).toBe(fast.tagCount);
      expect(slow.depth).toBe(fast.depth);
    }
  });

  it('documents the known divergence: browsers insert implicit elements the fast path does not', () => {
    // jsdom (and real browser DOMParsers) follow the HTML5 tree construction
    // algorithm: <tbody> is inserted into <table>, <head> into <html>.
    // The htmlparser2 fast path does no tree construction. Canonical output
    // differs for documents that rely on implicit elements, so hashers must
    // use one input mode consistently per deployment (see README).
    const { window } = new JSDOM(WRAP('<div></div>'));
    const doc = new window.DOMParser().parseFromString(WRAP('<div><table><tr><td>c</td></tr></table></div>'), 'text/html');
    const slow = canonicalize(doc.documentElement);
    const fast = canonicalizeString(WRAP('<div><table><tr><td>c</td></tr></table></div>'));
    expect(slow.canonical).toContain('<tbody>');
    expect(fast.canonical).not.toContain('<tbody>');
  });

  it('keeps entity-adjacent spaces (the original divergence)', () => {
    const fast = canonicalizeString(WRAP('<div>a &amp; b</div>'));
    expect(fast.canonical).toContain('<div>a &amp; b</div>');
  });

  it('treats text split at entity boundaries as one logical text node', () => {
    const full = WRAP('<div>text&nbsp;more</div>');
    const { window } = parseHTML(full);
    const slow = canonicalize(window.document.documentElement);
    const fast = canonicalizeString(full);
    expect(slow.canonical).toBe(fast.canonical);
    // NBSP is preserved in the middle of the text, only ends are trimmed
    expect(slow.canonical).toContain('text\u00A0more');
  });
});
