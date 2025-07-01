import { domhash } from '../src/index';

describe('domhash', () => {
  it('hashes element structure and returns result with shapeVector', async () => {
    const div = document.createElement('div');
    div.setAttribute('id', 'test');
    const span = document.createElement('span');
    div.appendChild(span);

    const result = await domhash(div, { shapeVector: true });
    expect(typeof result.hash).toBe('string');
    expect(result.shape).toEqual(['div', 'span']);
    expect(result.stats).toEqual({ tagCount: 2, depth: 1 });
    expect(result.canonical).toBe('<div id><span></span></div>');
  });
  
  it('includes structural score and breakdown', async () => {
    const html = '<div><span></span></div>';
    const result = await domhash(html, { shapeVector: true });
    expect(result.structuralScore).toBeGreaterThanOrEqual(0);
    expect(result.structuralScore).toBeLessThanOrEqual(1);
    expect(result.structuralBreakdown).toHaveProperty('tagPenalty');
    expect(result.structuralBreakdown).toHaveProperty('depthPenalty');
    expect(result.structuralBreakdown).toHaveProperty('repetitionPenalty');
    expect(result.structuralBreakdown).toHaveProperty('leafPenalty');
    expect(['Strong', 'Moderate', 'Fragile']).toContain(result.structuralLabel);
    expect(['✅', '⚠️', '❌']).toContain(result.structuralEmoji);
  });

  it('computes resilience when enabled', async () => {
    const div = document.createElement('div');
    div.innerHTML = '<span></span>';
    const result = await domhash(div, { shapeVector: true, resilience: true });
    expect(result.resilienceScore).toBeGreaterThanOrEqual(0);
    expect(result.resilienceScore).toBeLessThanOrEqual(1);
    expect(['Strong', 'Moderate', 'Fragile']).toContain(result.resilienceLabel);
    expect(['✅', '⚠️', '❌']).toContain(result.resilienceEmoji);
  });
  
  it('computes layout features when layoutAware is enabled', async () => {
    const div = document.createElement('div');
    div.innerHTML = '<p>test</p>';
    const result = await domhash(div, { layoutAware: true });
    expect(result.layoutCanonical).toContain('div:');
    expect(result.layoutShape).toBeInstanceOf(Array);
    expect(typeof result.layoutHash).toBe('string');
    expect(result.shape).toBeUndefined();
    expect((result as any).structureTree).toBeUndefined();
  });

  it('supports murmur3 algorithm option', async () => {
    const html = '<div></div>';
    const result = await domhash(html, { algorithm: 'murmur3' });
    expect(result.hash).toMatch(/^[0-9a-f]{8}$/);
  });
  it('compresses duplicate layout shapes correctly', async () => {
    const html = '<div><span></span><span></span><span></span></div>';
    const result = await domhash(html, { layoutAware: true });
    expect(result.layoutShape).toEqual(['div:block', 'span:block*3']);
  });
  
  it('respects inline styles for display, position, visibility, and opacity', async () => {
    const div = document.createElement('div');
    div.setAttribute(
      'style',
      'display:inline-block;position:relative;visibility:visible;opacity:0.3;'
    );
    document.body.appendChild(div);
    const result = await domhash(div, { layoutAware: true });
    // layoutCanonical should reflect all style properties and visibility flag
    expect(result.layoutCanonical!).toBe('div:inline-block/relative/visible/0.3/V');
    // layoutShape should capture the tag and display only
    expect(result.layoutShape!).toEqual(['div:inline-block']);
    document.body.removeChild(div);
  });

  it('marks elements hidden when display none, visibility hidden, or opacity zero', async () => {
    const cases = [
      { style: 'display:none;', hidden: true },
      { style: 'visibility:hidden;', hidden: true },
      { style: 'opacity:0;', hidden: true },
    ];
    for (const { style, hidden } of cases) {
      const el = document.createElement('span');
      el.setAttribute('style', style);
      document.body.appendChild(el);
      const result = await domhash(el, { layoutAware: true });
      // layoutCanonical ends with /H when hidden, /V otherwise
      const suffix = hidden ? '/H' : '/V';
      expect(result.layoutCanonical!.endsWith(suffix)).toBe(true);
      document.body.removeChild(el);
    }
  });
});