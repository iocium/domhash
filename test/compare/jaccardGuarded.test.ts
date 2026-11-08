import { describe, expect, it } from 'bun:test';
import {
  compareShapeJaccard,
  compareShapeJaccardGuarded,
  compareLayoutVectors,
  shapeLengthRatio,
} from '../../src/compare/metrics';

describe('shapeLengthRatio', () => {
  it('returns 1 for equal lengths', () => {
    expect(shapeLengthRatio(['a'], ['b'])).toBe(1);
  });

  it('returns 1 for two empty vectors', () => {
    expect(shapeLengthRatio([], [])).toBe(1);
  });

  it('returns the min/max ratio otherwise', () => {
    expect(shapeLengthRatio(['a', 'b'], ['a', 'b', 'c', 'd'])).toBe(0.5);
  });

  it('returns 0 when one side is empty', () => {
    expect(shapeLengthRatio([], ['a'])).toBe(0);
  });
});

describe('compareShapeJaccardGuarded', () => {
  it('equals jaccard when lengths match', () => {
    const a = ['div', 'span*2', 'p'];
    const b = ['div', 'span*2', 'em'];
    expect(compareShapeJaccardGuarded(a, b)).toBe(compareShapeJaccard(a, b));
  });

  it('bounds plain jaccard when one vector is a padded duplicate (dilution case)', () => {
    // Plain (set-based) Jaccard scores a vector against its own duplication as
    // 1.0 because the token sets are identical. The length-ratio guard keeps
    // the score bounded by how differently sized the two structures are.
    const a = Array.from({ length: 50 }, (_, i) => `div:block${i}`);
    const b = [...a, ...a];
    const plain = compareShapeJaccard(a, b);
    const guarded = compareShapeJaccardGuarded(a, b);
    expect(plain).toBe(1);
    expect(guarded).toBe(0.5);
  });

  it('stays below plain jaccard when run-length growth inflates one vector', () => {
    // Plain (set-based) Jaccard ignores how many times a token repeats, so
    // growing a run (same tag, more elements) does not lower it at all. The
    // length-ratio guard does.
    const a = ['div:block', 'div:block', 'div:block', 'div:block'];
    const b = [...a, ...Array(6).fill('div:block'), ...Array(6).fill('span:inline')];
    const plain = compareShapeJaccard(a, b);
    const guarded = compareShapeJaccardGuarded(a, b);
    expect(plain).toBeGreaterThan(guarded);
    expect(guarded).toBeCloseTo(4 / 16, 10);
  });

  it('returns 1 for two empty vectors', () => {
    expect(compareShapeJaccardGuarded([], [])).toBe(1);
  });

  it('returns 0 when one vector is empty', () => {
    expect(compareShapeJaccardGuarded([], ['a'])).toBe(0);
  });

  it('is accepted by compareLayoutVectors', () => {
    const a = ['div:block'];
    const b = ['div:block', 'span:inline'];
    expect(compareLayoutVectors(a, b, 'jaccard-guarded')).toBe(
      compareShapeJaccardGuarded(a, b)
    );
  });
});
