export interface LayoutFeature {
  tag: string;
  display: string;
}

export function extractLayoutFeatures(root: Element): LayoutFeature[] {
  const features: LayoutFeature[] = [];

  function visit(el: Element): void {
    const tag = el.tagName.toLowerCase();
    let display = 'block';

    if (typeof globalThis.getComputedStyle === 'function') {
      try {
        display = getComputedStyle(el).display || 'block';
      } catch {}
    } else if ('getAttribute' in el && typeof el.getAttribute === 'function') {
      const inline = el.getAttribute('style') || '';
      const m = inline.match(/display\s*:\s*([^;]+)/);
      display = m ? m[1] : 'block';
    } else if ('display' in el) {
      display = (el as any).display || 'block';
    }

    features.push({ tag, display });
    for (const child of el.children) visit(child as Element);
  }

  visit(root);
  return features;
}

export function serializeLayoutFeatures(layout: LayoutFeature[]): string {
  return layout.map(f => `${f.tag}:${f.display}`).join(',');
}

export interface ResilienceBreakdown {
  score: number;
  breakdown: {
    tagPenalty: number;
    depthPenalty: number;
    layoutPenalty: number;
  };
  label: 'Strong' | 'Moderate' | 'Fragile';
  emoji: '✅' | '⚠️' | '❌';
}

/**
 * Estimate how structurally resilient a DOM shape is to minor changes.
 */
export function computeResilienceScore(
  structure: string[],
  layout?: string[]
): ResilienceBreakdown {
  const tagVariety = new Set(structure).size;
  const tagPenalty = 1 - Math.min(tagVariety / structure.length, 1);
  const depthPenalty = structure.length > 0 ? Math.min(1, structure.length / 100) : 0;
  const layoutVariety = layout?.length ? new Set(layout.map(d => d.split(':')[1])).size : 0;
  const layoutPenalty = layout?.length ? 1 - Math.min(layoutVariety / layout.length, 1) : 0;

  const penalties = layout !== undefined
    ? [tagPenalty, layoutPenalty]
    : [tagPenalty, depthPenalty, layoutPenalty];
  const avgPenalty = penalties.reduce((a, b) => a + b, 0) / penalties.length;
  const score = Math.max(0, 1 - avgPenalty);

  let label: ResilienceBreakdown['label'] = 'Strong';
  let emoji: ResilienceBreakdown['emoji'] = '✅';
  if (score < 0.5) {
    label = 'Fragile';
    emoji = '❌';
  } else if (score < 0.85) {
    label = 'Moderate';
    emoji = '⚠️';
  }

  return {
    score,
    breakdown: {
      tagPenalty,
      depthPenalty,
      layoutPenalty
    },
    label,
    emoji
  };
}