import { parseInput } from './core/parser';
import { canonicalize } from './core/canonicalizer';
import { hashStructure } from './core/hasher';
import {
  computeResilienceScore,
  extractLayoutFeatures,
  serializeLayoutFeatures,
  computeStructuralScore,
} from './core/layout';
import { DomHashOptions, DomHashResult } from './types';
import { extractDOMStructureTree } from './core/structureTree';
/**
 * Collapse consecutive identical layout shape entries via run-length encoding.
 * E.g., ['div:block', 'div:block', 'span:inline'] => ['div:block*2', 'span:inline']
 */
function compressShapeVector(shape: string[]): string[] {
  const compressed: string[] = [];
  let last: string | undefined;
  let count = 0;
  for (const entry of shape) {
    if (entry === last) {
      count++;
    } else {
      if (last !== undefined) {
        compressed.push(count > 1 ? `${last}*${count}` : last);
      }
      last = entry;
      count = 1;
    }
  }
  if (last !== undefined) {
    compressed.push(count > 1 ? `${last}*${count}` : last);
  }
  return compressed;
}

/**
 * Generate a DOM hash from input HTML, DOM node, or URL.
 * @param input - HTML string, Document, Element or URL
 * @param options - Configuration options
 * @returns A promise resolving to a DomHashResult
 */
export async function domhash(
  input: string | URL | Document | Element,
  options: DomHashOptions = {}
): Promise<DomHashResult> {
  const dom = await parseInput(input, options);
  const structure = canonicalize(dom, options);
  const hash = await hashStructure(structure.canonical, options.algorithm || 'sha256');

  const layout = options.layoutAware ? extractLayoutFeatures(dom) : null;
  const layoutCanonical = layout ? serializeLayoutFeatures(layout) : '';
  const layoutHash = layout ? await hashStructure(layoutCanonical, options.algorithm || 'sha256') : undefined;
  // derive layout shape entries and collapse consecutive duplicates
  const rawLayoutShape = layout ? layout.map(f => `${f.tag}:${f.display}`) : undefined;
  const layoutShape = rawLayoutShape ? compressShapeVector(rawLayoutShape) : undefined;

  const structureTree = options.shapeVector ? extractDOMStructureTree(dom) : undefined;

  const base = {
    hash,
    shape: options.shapeVector ? structure.shape : undefined,
    stats: {
      tagCount: structure.tagCount,
      depth: structure.depth,
    },
    canonical: structure.canonical,
    ...(options.layoutAware ? { layoutHash, layoutCanonical, layoutShape } : {}),
    ...(structureTree ? { structureTree } : {})
  };

  const structural = computeStructuralScore(structure.shape || []);
  (base as any).structuralScore = structural.score;
  (base as any).structuralBreakdown = structural.breakdown;
  (base as any).structuralLabel = structural.label;
  (base as any).structuralEmoji = structural.emoji;

  if (options.resilience) {
    const res = computeResilienceScore(structure.shape || [], layoutShape);
    return {
      ...base,
      resilienceScore: res.score,
      resilienceBreakdown: res.breakdown,
      resilienceLabel: res.label,
      resilienceEmoji: res.emoji,
    };
  }

  return base;
}

export * from './compare/metrics';
export { computeResilienceScore, ResilienceBreakdown } from './core/layout';
export type { DomHashOptions, DomHashResult } from './types';
export { getStructuralDiff } from './format';