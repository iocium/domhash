import { canonicalize } from '../src/core/canonicalizer';

describe('canonicalize', () => {
  it('produces canonical HTML and shape for simple tree', () => {
    const div = document.createElement('div');
    div.setAttribute('id', 'test');
    const span1 = document.createElement('span');
    const span2 = document.createElement('span');
    span1.textContent = 'hello';
    span2.textContent = 'world';
    div.append(span1, span2);
    const { canonical, shape, tagCount, depth } = canonicalize(div);
    expect(canonical).toBe('<div id><span>hello</span><span>world</span></div>');
    expect(shape).toEqual(['div', 'span*2']);
    expect(tagCount).toBe(3);
    expect(depth).toBe(1);
  });

  it('filters attributes correctly based on includeAttributes and aria/data flags', () => {
    const p = document.createElement('p');
    p.setAttribute('data-test', 'foo');
    p.setAttribute('aria-label', 'bar');
    p.setAttribute('role', 'button');
    // include only 'role', skip data-* and aria-* by default
    const { canonical } = canonicalize(p, { includeAttributes: ['role'] });
    expect(canonical).toBe('<p role></p>');
  });
});