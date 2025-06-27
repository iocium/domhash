import {
  compareStructures,
  compareShapeJaccard,
  compareShapeLCS,
  compareShapeCosine,
  compareTreeEditDistance,
  compareLayoutVectors
} from '../src/compare/metrics';

describe('compareStructures', () => {
  it('returns 1 for identical strings', () => {
    expect(compareStructures('abc', 'abc')).toBe(1);
  });

  it('returns less than 1 for different strings', () => {
    const sim = compareStructures('abcd', 'abxy');
    expect(sim).toBeGreaterThanOrEqual(0);
    expect(sim).toBeLessThan(1);
  });
});

describe('compareShapeJaccard', () => {
  it('returns 1 for two empty arrays', () => {
    expect(compareShapeJaccard([], [])).toBe(1);
  });

  it('returns 0 for disjoint sets', () => {
    expect(compareShapeJaccard(['a'], ['b'])).toBe(0);
  });

  it('computes correct Jaccard for overlapping', () => {
    expect(compareShapeJaccard(['a', 'b'], ['b', 'c'])).toBe(1 / 3);
  });
});

describe('compareShapeLCS', () => {
  it('returns 1 for two empty arrays', () => {
    expect(compareShapeLCS([], [])).toBe(1);
  });

  it('computes LCS similarity', () => {
    const a = ['x', 'y', 'z'];
    const b = ['a', 'y', 'z', 'b'];
    expect(compareShapeLCS(a, b)).toBeCloseTo(2 / Math.max(a.length, b.length));
  });
});

describe('compareShapeCosine', () => {
  it('returns 1 for identical arrays', () => {
    expect(compareShapeCosine(['a', 'b', 'b'], ['b', 'a', 'b'])).toBe(1);
  });

  it('returns 1 for empty arrays', () => {
    expect(compareShapeCosine([], [])).toBe(1);
  });
});

describe('compareTreeEditDistance', () => {
  it('returns 1 for empty arrays', () => {
    expect(compareTreeEditDistance([], [])).toBe(1);
  });

  it('computes TED similarity', () => {
    const sim = compareTreeEditDistance(['a', 'b'], ['a', 'c']);
    expect(sim).toBeLessThan(1);
    expect(sim).toBeGreaterThanOrEqual(0);
  });
});

describe('compareLayoutVectors', () => {
  const a = ['x:block', 'y:inline'];
  const b = ['x:block', 'z:inline'];
  it('delegates to jaccard by default', () => {
    expect(compareLayoutVectors(a, b)).toBe(compareShapeJaccard(a, b));
  });

  it('supports all metric types', () => {
    expect(compareLayoutVectors(a, b, 'jaccard')).toBe(compareShapeJaccard(a, b));
    expect(compareLayoutVectors(a, b, 'lcs')).toBe(compareShapeLCS(a, b));
    expect(compareLayoutVectors(a, b, 'cosine')).toBe(compareShapeCosine(a, b));
    expect(compareLayoutVectors(a, b, 'ted')).toBe(compareTreeEditDistance(a, b));
  });

  it('throws on unknown metric', () => {
    // @ts-ignore
    expect(() => compareLayoutVectors(a, b, 'unknown')).toThrow(/Unknown layout similarity metric/);
  });
});