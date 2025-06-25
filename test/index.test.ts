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
});