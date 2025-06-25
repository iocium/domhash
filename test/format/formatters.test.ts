import { formatAsJSON } from '../../src/format/jsonFormatter';
import { formatAsMarkdown } from '../../src/format/markdownFormatter';
import { formatAsHTML } from '../../src/format/htmlFormatter';
import { formatResult, getStructuralDiff, DomHashComparisonResult } from '../../src/format';

describe('formatAsJSON', () => {
  it('returns pretty JSON string', () => {
    const obj: DomHashComparisonResult = {
      hashA: 'a',
      hashB: 'b',
      similarity: 0.5,
    };
    const json = formatAsJSON(obj);
    expect(json).toBe(JSON.stringify(obj, null, 2));
  });
});

describe('formatAsMarkdown', () => {
  it('includes headers and diff blocks', () => {
    const result: DomHashComparisonResult = {
      hashA: 'a',
      hashB: 'b',
      similarity: 0.5,
      shapeSimilarity: 0.25,
      diff: ['- <a>', '+ <b>'],
    };
    const md = formatAsMarkdown(result);
    expect(md).toContain('### DOM Hash Comparison Report');
    expect(md).toContain(`**SHA A:** \`${result.hashA}\``);
    expect(md).toContain('```diff');
  });
});

describe('formatAsHTML', () => {
  it('wraps content in HTML structure with styling', () => {
    const result: DomHashComparisonResult = {
      hashA: 'a',
      hashB: 'b',
      similarity: 0.5,
      shapeSimilarity: 0.25,
      diff: ['- <a>', '+ <b>'],
    };
    const html = formatAsHTML(result);
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<title>DOM Hash Comparison</title>');
    expect(html).toContain(`<code>${result.hashA}</code>`);
    expect(html).toContain("class='add'");
  });
});

describe('formatAsHTML with missing optional fields', () => {
  it('omits shape similarity row and diff section when not provided', () => {
    const result: DomHashComparisonResult = {
      hashA: 'a',
      hashB: 'b',
      similarity: 0.5,
    };
    const html = formatAsHTML(result);
    expect(html).not.toContain('Shape Similarity');
    expect(html).not.toContain('Structural Diff');
  });
});

describe('formatResult', () => {
  const sample: DomHashComparisonResult = {
    hashA: 'x',
    hashB: 'y',
    similarity: 1,
  };

  it('selects JSON formatter', () => {
    expect(formatResult(sample, 'json')).toBe(JSON.stringify(sample, null, 2));
  });

  it('selects markdown formatter', () => {
    expect(formatResult(sample, 'markdown')).toContain('### DOM Hash Comparison Report');
  });

  it('throws on unsupported format', () => {
    expect(() => formatResult(sample, 'xml' as any)).toThrow('Unsupported format: xml');
  });
});

describe('getStructuralDiff', () => {
  it('computes line-by-line structural diff', () => {
    const a = '<a><b></b></a>';
    const b = '<a><c></c></a>';
    const diff = getStructuralDiff(a, b);
    expect(diff).toEqual([
      '  <a>',
      '- <b></b>',
      '+ <c></c>',
      '  </a>',
    ]);
  });
});