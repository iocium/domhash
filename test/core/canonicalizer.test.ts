import { canonicalize } from '../../src/core/canonicalizer';

describe('canonicalize', () => {
  it('serializes structure correctly with attributes and shapeVector', () => {
    const div = document.createElement('div');
    div.setAttribute('id', 'test');
    const span = document.createElement('span');
    div.appendChild(span);

    const result = canonicalize(div);
    expect(result.shape).toEqual(['div', 'span']);
    expect(result.tagCount).toBe(2);
    expect(result.depth).toBe(1);
    expect(result.canonical).toBe('<div id><span></span></div>');
  });

  it('skips data and aria attributes by default', () => {
    const div = document.createElement('div');
    div.setAttribute('data-foo', 'bar');
    const result = canonicalize(div);
    expect(result.canonical).toBe('<div></div>');
  });

  it('includes data and aria attributes when enabled', () => {
    const div = document.createElement('div');
    div.setAttribute('data-foo', 'bar');
    const result = canonicalize(div, { includeDataAndAriaAttributes: true });
    expect(result.canonical).toBe('<div data-foo></div>');
  });

  it('sorts attributes alphabetically', () => {
    const div = document.createElement('div');
    div.setAttribute('z', '1');
    div.setAttribute('a', '2');
    const result = canonicalize(div);
    expect(result.canonical).toBe('<div a z></div>');
  });
  
  it('includes only specified attributes when includeAttributes is provided', () => {
    const div = document.createElement('div');
    div.setAttribute('id', 'one');
    div.setAttribute('class', 'two');
    div.setAttribute('data-foo', 'bar');
    // include only class and data-foo; enable data/aria inclusion
    const result = canonicalize(div, {
      includeAttributes: ['class', 'data-foo'],
      includeDataAndAriaAttributes: true,
    });
    // attribute names only, sorted
    expect(result.canonical).toBe('<div class data-foo></div>');
  });
});