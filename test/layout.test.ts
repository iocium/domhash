import {
  extractLayoutFeatures,
  serializeLayoutFeatures,
  computeStructuralScore,
  computeResilienceScore
} from '../src/core/layout';

describe('layout features and serialization', () => {
  it('extracts features for elements with inline styles', () => {
    const div = document.createElement('div');
    div.setAttribute('style', 'display:inline;visibility:hidden;opacity:0.5;position:absolute;');
    const p = document.createElement('p');
    p.setAttribute('style', 'display:block;');
    div.appendChild(p);
    const features = extractLayoutFeatures(div);
    // First entry is div
    expect(features[0]).toMatchObject({
      tag: 'div', display: 'inline', visibility: 'hidden', opacity: '0.5', position: 'absolute', isHidden: true
    });
    // Second entry is p
    expect(features[1]).toMatchObject({
      tag: 'p', display: 'block', visibility: 'visible', opacity: '1', position: 'static', isHidden: false
    });
  });
  it('uses getComputedStyle when no inline style is present', () => {
    const div = document.createElement('div');
    const features = extractLayoutFeatures(div);
    expect(features[0]).toMatchObject({
      tag: 'div',
      display: expect.any(String),
      visibility: expect.any(String),
      opacity: expect.any(String),
      position: expect.any(String),
      isHidden: false
    });
  });

  it('serializes layout features into string', () => {
    const features = [
      { tag: 'div', display: 'block', position: 'static', visibility: 'visible', opacity: '1', isHidden: false }
    ];
    const out = serializeLayoutFeatures(features as any);
    expect(out).toBe('div:block/static/visible/1/V');
  });
});

describe('structural score', () => {
  it('returns perfect score for empty structure', () => {
    const result = computeStructuralScore([]);
    expect(result.score).toBe(1);
  });

  it('penalizes repetitive tags', () => {
    const arr = ['div', 'div', 'div', 'span', 'span'];
    const result = computeStructuralScore(arr);
    expect(result.breakdown.repetitionPenalty).toBeGreaterThan(0);
    expect(result.score).toBeLessThan(1);
  });
});

describe('resilience score', () => {
  it('returns perfect score for diverse structure and layout', () => {
    const structure = ['a', 'b', 'c'];
    const layout = ['a:block', 'b:inline', 'c:inline'];
    const result = computeResilienceScore(structure, layout);
    expect(result.score).toBe(1);
    expect(result.label).toBe('Strong');
  });

  it('handles missing or empty layout gracefully', () => {
    const result = computeResilienceScore([], []);
    expect(result.score).toBe(1);
  });
});