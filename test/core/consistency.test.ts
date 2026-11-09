import { describe, expect, it } from 'bun:test';
import { canonicalizeString } from '../../src/core/parse5Canonicalizer';
import { canonicalize } from '../../src/core/canonicalizer';
import { parseInput } from '../../src/core/parser';
import { JSDOM } from 'jsdom';

/**
 * The string fast path (parse5), the DOM path (Element traversal), and the
 * Node fallback (parseInput without DOMParser, parse5 + Parse5Element
 * adapter) must all produce identical canonical output for the same
 * document. parse5 implements the WHATWG tree construction algorithm, so
 * every path matches browsers/jsdom exactly.
 *
 * These cases are regression tests for historical divergences: entity-
 * adjacent spaces, NBSP handling, control whitespace, parser-specific
 * text-node splitting, and implicit-element tree construction.
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

const TABLE_CASE = '<div><table><tr><td>c</td></tr></table></div>';

describe('fast path vs DOM path consistency', () => {
  it('produces identical canonical output via the Node parseInput fallback (no DOMParser)', async () => {
    // Exercises the real plain-Node path: parse5 + Parse5Element adapter.
    const original = (globalThis as any).DOMParser;
    delete (globalThis as any).DOMParser;
    try {
      for (const c of [...CASES, TABLE_CASE]) {
        const full = WRAP(c);
        const fast = canonicalizeString(full);
        const el = await parseInput(full);
        const slow = canonicalize(el);
        expect(slow.canonical, `fallback: ${c}`).toBe(fast.canonical);
        expect(slow.shape, `fallback: ${c}`).toEqual(fast.shape);
        expect(slow.tagCount).toBe(fast.tagCount);
        expect(slow.depth).toBe(fast.depth);
      }
    } finally {
      (globalThis as any).DOMParser = original;
    }
  });

  it('produces identical canonical output across all regression cases (jsdom DOM)', () => {
    const { window } = new JSDOM(WRAP('<div></div>'));
    const parser = new window.DOMParser();
    for (const c of [...CASES, TABLE_CASE]) {
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

  it('inserts implicit elements identically to browsers (table case)', () => {
    // parse5 follows the HTML5 tree construction algorithm, so the fast path
    // now inserts the implicit <tbody> exactly like jsdom/real browsers do.
    const { window } = new JSDOM(WRAP('<div></div>'));
    const doc = new window.DOMParser().parseFromString(WRAP(TABLE_CASE), 'text/html');
    const slow = canonicalize(doc.documentElement);
    const fast = canonicalizeString(WRAP(TABLE_CASE));
    expect(fast.canonical).toContain('<tbody>');
    expect(fast.canonical).toBe(slow.canonical);
  });

  it('wraps snippet input into a full document, matching the DOM path', () => {
    // Passing a bare snippet as a string now parses it as a full document
    // (html/head/body), exactly like DOMParser in a browser — previously the
    // fast path hashed the snippet as-is, diverging from browser DOM input.
    const snippet = '<div><span>Hi</span></div>';
    const { window } = new JSDOM(WRAP('<div></div>'));
    const doc = new window.DOMParser().parseFromString(snippet, 'text/html');
    const fromElement = canonicalize(doc.documentElement);
    const fromString = canonicalizeString(snippet);
    expect(fromString.canonical).toContain('<html>');
    expect(fromString.canonical).toBe(fromElement.canonical);
  });

  it('keeps entity-adjacent spaces (the original divergence)', () => {
    const fast = canonicalizeString(WRAP('<div>a &amp; b</div>'));
    expect(fast.canonical).toContain('<div>a &amp; b</div>');
  });

  it('treats text split at entity boundaries as one logical text node', () => {
    const full = WRAP('<div>text&nbsp;more</div>');
    const { window } = new JSDOM(full);
    const slow = canonicalize(window.document.documentElement);
    const fast = canonicalizeString(full);
    expect(slow.canonical).toBe(fast.canonical);
    // NBSP is preserved in the middle of the text, only ends are trimmed
    expect(slow.canonical).toContain('text\u00A0more');
  });
});
