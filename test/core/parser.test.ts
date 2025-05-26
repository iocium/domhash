import { parseInput } from '../../src/core/parser';

describe('parseInput', () => {
  it('returns the same element when passed an Element', async () => {
    const div = document.createElement('div');
    const el = await parseInput(div);
    expect(el).toBe(div);
  });

  it('returns documentElement when passed a Document', async () => {
    const doc = document;
    const el = await parseInput(doc);
    expect(el).toBe(doc.documentElement);
  });

  it('parses HTML string into a documentElement', async () => {
    const el = await parseInput('<div><span>hi</span></div>');
    expect(el.tagName.toLowerCase()).toBe('html');
    expect(el.querySelector('span')?.textContent).toBe('hi');
  });

  it('throws for unsupported input types', async () => {
    await expect(parseInput(123 as any)).rejects.toThrow();
  });
});