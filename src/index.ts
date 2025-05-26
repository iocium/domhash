// src/index.ts

import { parseInput } from './core/parser';
import { canonicalize } from './core/canonicalizer';
import { hashStructure } from './core/hasher';
import { computeResilienceScore, extractLayoutFeatures, serializeLayoutFeatures } from './core/layout';
import { DomHashOptions, DomHashResult } from './types';
import * as compare from './compare/metrics';

/**
 * Generate a DOM hash from input HTML, DOM node, or URL.
 * @param input - HTML string, Document, Element or URL
 * @param options - Configuration options
 * @returns A promise resolving to a DomHashResult
 */
export async function domhash(input: string | URL | Document | Element, options: DomHashOptions = {}): Promise<DomHashResult> {
  const dom = await parseInput(input);
  const structure = canonicalize(dom, options);
  const hash = await hashStructure(structure.canonical, options.algorithm || 'sha256');

  const layout = options.layoutAware ? extractLayoutFeatures(dom) : null;
  const layoutCanonical = layout ? serializeLayoutFeatures(layout) : '';
  const layoutHash = layout ? await hashStructure(layoutCanonical, options.algorithm || 'sha256') : undefined;
  const layoutShape = layout ? layout.map(f => `${f.tag}:${f.display}`) : undefined;

  const base = {
    hash,
    shape: options.shapeVector ? structure.shape : undefined,
    stats: {
      tagCount: structure.tagCount,
      depth: structure.depth,
    },
    canonical: structure.canonical,
    ...(options.layoutAware ? { layoutHash, layoutCanonical, layoutShape } : {})
  };

  if (options.resilience) {
    const res = computeResilienceScore(structure.shape || [], layoutShape);
    return {
      ...base,
      resilienceScore: res.score,
      resilienceBreakdown: res.breakdown,
      resilienceLabel: res.label,
      resilienceEmoji: res.emoji
    };
  }

  return base;
}

export * from './compare/metrics';
export { computeResilienceScore } from './core/layout';