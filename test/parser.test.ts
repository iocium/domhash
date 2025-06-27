import { parseInput } from '../src/core/parser';

describe('parseInput', () => {
  it('returns the same element when input is an Element', async () => {
    const div = document.createElement('div');
    const out = await parseInput(div);
    expect(out).toBe(div);
  });

  it('parses HTML string into documentElement', async () => {
    const html = '<span>Hi</span>';
    const out = await parseInput(html);
    // parseInput wraps into full HTML document
    expect(out.tagName.toLowerCase()).toBe('html');
    const span = out.querySelector('span');
    expect(span).not.toBeNull();
    expect(span!.textContent).toBe('Hi');
  });
});