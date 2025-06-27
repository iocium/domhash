import { formatResult, getStructuralDiff } from '../src/format';

describe('formatResult', () => {
  const base = {
    hashA: 'h1',
    hashB: 'h2',
    similarity: 0.5,
    shapeSimilarity: 0.25,
    diff: ['  <div>', '- <p>', '+ <span>']
  };

  it('formats JSON output', () => {
    const out = formatResult(base, 'json');
    const obj = JSON.parse(out);
    expect(obj).toMatchObject(base);
  });

  it('formats Markdown output', () => {
    const md = formatResult(base, 'markdown');
    expect(md).toContain('### DOM Hash Comparison Report');
    expect(md).toContain('`h1`');
    expect(md).toContain('Shape Similarity');
    expect(md).toMatch(/```diff[\s\S]*\+ <span>/);
  });

  it('formats HTML output', () => {
    const html = formatResult(base, 'html');
    expect(html).toMatch(/<title>DOM Hash Comparison<\/title>/);
    expect(html).toContain('h1');
    expect(html).toMatch(/\+ <span>/);
  });

  it('throws on unsupported format', () => {
    // @ts-ignore
    expect(() => formatResult(base, 'txt')).toThrow(/Unsupported format/);
  });
});

describe('getStructuralDiff', () => {
  it('generates diff lines for differing HTML', () => {
    const a = '<div><p>A</p></div>';
    const b = '<div><p>B</p></div>';
    const diff = getStructuralDiff(a, b);
    expect(diff.some(line => line.startsWith('-'))).toBe(true);
    expect(diff.some(line => line.startsWith('+'))).toBe(true);
    expect(diff.some(line => line.trim().startsWith('<div>'))).toBe(true);
  });
});