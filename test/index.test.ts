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

  it('computes resilience when enabled', async () => {
    const div = document.createElement('div');
    div.innerHTML = '<span></span>';
    const result = await domhash(div, { shapeVector: true, resilience: true });
    expect(result.resilienceScore).toBeGreaterThanOrEqual(0);
    expect(result.resilienceScore).toBeLessThanOrEqual(1);
    expect(['Strong', 'Moderate', 'Fragile']).toContain(result.resilienceLabel);
    expect(['✅', '⚠️', '❌']).toContain(result.resilienceEmoji);
  });
});