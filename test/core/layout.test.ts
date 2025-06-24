import { extractLayoutFeatures, serializeLayoutFeatures, computeResilienceScore } from '../../src/core/layout';

describe('extractLayoutFeatures and serializeLayoutFeatures', () => {
  describe('inline style fallback when getComputedStyle is unavailable', () => {
    let originalGetComputedStyle: any;

    beforeAll(() => {
      originalGetComputedStyle = (global as any).getComputedStyle;
      delete (global as any).getComputedStyle;
    });

    afterAll(() => {
      (global as any).getComputedStyle = originalGetComputedStyle;
    });

    it('extracts display from inline style attributes and serializes correctly', () => {
      const div = document.createElement('div');
      div.setAttribute('style', 'display:inline-block');
      const span = document.createElement('span');
      span.setAttribute('style', 'display:flex');
      div.appendChild(span);

      const features = extractLayoutFeatures(div);
      expect(features).toEqual([
        {
          tag: 'div',
          display: 'inline-block',
          visibility: 'visible',
          opacity: '1',
          position: 'static',
          isHidden: false,
        },
        {
          tag: 'span',
          display: 'flex',
          visibility: 'visible',
          opacity: '1',
          position: 'static',
          isHidden: false,
        },
      ]);
      const serialized = serializeLayoutFeatures(features);
      expect(serialized).toBe(
        'div:inline-block/static/visible/1/V,span:flex/static/visible/1/V'
      );
    });
  });
});

describe('computeResilienceScore', () => {
  it('labels Strong for high resilience', () => {
    const structure = ['a'];
    const result = computeResilienceScore(structure);
    expect(result.label).toBe('Strong');
    expect(result.emoji).toBe('✅');
    expect(result.score).toBeGreaterThan(0.9);
  });

  it('labels Moderate for medium resilience', () => {
    const structure = Array(100).fill('a');
    const layout: string[] = [];
    const result = computeResilienceScore(structure, layout);
    expect(result.label).toBe('Moderate');
    expect(result.emoji).toBe('⚠️');
    expect(result.score).toBeGreaterThanOrEqual(0.5);
    expect(result.score).toBeLessThan(0.85);
  });

  it('labels Fragile for low resilience', () => {
    const structure = Array(200).fill('a');
    const result = computeResilienceScore(structure);
    expect(result.label).toBe('Fragile');
    expect(result.emoji).toBe('❌');
    expect(result.score).toBeLessThan(0.5);
  });
});