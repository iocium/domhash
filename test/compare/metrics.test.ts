import {
  compareStructures,
  compareShapeVectors,
  compareShapeLCS,
  compareShapeCosine,
  compareTreeEditDistance,
  compareLayoutVectors,
} from '../../src/compare/metrics';

describe('compareStructures', () => {
  it('returns 1 for identical strings', () => {
    expect(compareStructures('hello', 'hello')).toBe(1);
  });

  it('returns correct similarity for single character difference', () => {
    expect(compareStructures('a', 'b')).toBe(0);
  });

  it('returns 1 for two empty strings', () => {
    expect(compareStructures('', '')).toBe(1);
  });
});

describe('compareShapeVectors', () => {
  it('computes Jaccard similarity correctly', () => {
    const a = ['div', 'span'];
    const b = ['div', 'p'];
    expect(compareShapeVectors(a, b)).toBeCloseTo(1 / 3);
  });
});

describe('compareShapeLCS', () => {
  it('computes LCS-based similarity correctly', () => {
    const a = ['a', 'b', 'c'];
    const b = ['a', 'x', 'c'];
    expect(compareShapeLCS(a, b)).toBeCloseTo(2 / 3);
  });
});

describe('compareShapeCosine', () => {
  it('computes cosine similarity correctly', () => {
    const a = ['a', 'a', 'b'];
    const b = ['a', 'b', 'b'];
    expect(compareShapeCosine(a, b)).toBeCloseTo(0.8);
  });
});

describe('compareTreeEditDistance', () => {
  it('computes tree edit distance similarity correctly', () => {
    const a = ['a', 'b'];
    const b = ['a', 'c'];
    expect(compareTreeEditDistance(a, b)).toBeCloseTo(0.5);
  });
});

describe('compareLayoutVectors', () => {
  it('delegates to compareShapeVectors', () => {
    const a = ['x', 'y'];
    const b = ['x'];
    expect(compareLayoutVectors(a, b)).toBe(compareShapeVectors(a, b));
  });
});