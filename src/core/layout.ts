export interface LayoutFeature {
  tag: string;
  display: string;
  visibility?: string;
  opacity?: string;
  position?: string;
  isHidden?: boolean;
}

export function extractLayoutFeatures(root: Element): LayoutFeature[] {
  const features: LayoutFeature[] = [];

  function visit(el: Element): void {
    const tag = el.tagName.toLowerCase();
    let display = 'block';
    let visibility = 'visible';
    let opacity = '1';
    let position = 'static';

    // Parse inline style attribute if present
    const inlineStyle = typeof el.getAttribute === 'function' ? el.getAttribute('style') || '' : '';
    if (inlineStyle) {
      display = inlineStyle.match(/display:\s*([\w-]+)/)?.[1] || display;
      visibility = inlineStyle.match(/visibility:\s*(\w+)/)?.[1] || visibility;
      opacity = inlineStyle.match(/opacity:\s*([\d.]+)/)?.[1] || opacity;
      position = inlineStyle.match(/position:\s*([\w-]+)/)?.[1] || position;
    } else if (typeof getComputedStyle === 'function') {
      try {
        const style = getComputedStyle(el);
        display = style.display || display;
        visibility = style.visibility || visibility;
        opacity = style.opacity || opacity;
        position = style.position || position;
      } catch {}
    } else if ('display' in el) {
      display = (el as any).display || display;
    }

    const isHidden = display === 'none' || visibility === 'hidden' || parseFloat(opacity) === 0;

    features.push({ tag, display, visibility, opacity, position, isHidden });

    if (el.children) {
      for (const child of Array.from(el.children)) {
        visit(child as Element);
      }
    } else if ('children' in el && Array.isArray((el as any).children)) {
      for (const child of (el as any).children) {
        visit(child);
      }
    }
  }

  visit(root);
  return features;
}

export function serializeLayoutFeatures(layout: LayoutFeature[]): string {
  return layout
    .map(f => `${f.tag}:${f.display}/${f.position}/${f.visibility}/${f.opacity}/${f.isHidden ? 'H' : 'V'}`)
    .join(',');
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

export interface StructuralBreakdown {
  score: number;
  breakdown: {
    tagPenalty: number;
    depthPenalty: number;
    repetitionPenalty: number;
    leafPenalty: number;
  };
  label: 'Strong' | 'Moderate' | 'Fragile';
  emoji: '✅' | '⚠️' | '❌';
}

export function computeStructuralScore(structure: string[]): StructuralBreakdown {
  const tagPenalty = structure.length > 0
    ? 1 - Math.min(new Set(structure).size / structure.length, 1)
    : 0;
  const depthPenalty = structure.length > 0
    ? Math.min(1, structure.length / 100)
    : 0;
  const repetitionPenalty = structure.length > 0
    ? (() => {
        let maxRun = 1;
        let currentRun = 1;
        for (let i = 1; i < structure.length; i++) {
          if (structure[i] === structure[i - 1]) {
            currentRun++;
            maxRun = Math.max(maxRun, currentRun);
          } else {
            currentRun = 1;
          }
        }
        return Math.min(maxRun / 20, 1);
      })()
    : 0;
  const leafPenalty = structure.length > 0
    ? structure.filter(tag => tag === 'div' || tag === 'span').length / structure.length
    : 0;

  const penalties = [tagPenalty, depthPenalty, repetitionPenalty, leafPenalty];
  const avgPenalty = penalties.reduce((a, b) => a + b, 0) / penalties.length;
  const score = Math.max(0, 1 - avgPenalty);

  let label: StructuralBreakdown['label'] = 'Strong';
  let emoji: StructuralBreakdown['emoji'] = '✅';
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
      repetitionPenalty,
      leafPenalty
    },
    label,
    emoji
  };
}

export function computeResilienceScore(structure: string[], layout?: string[]): ResilienceBreakdown {
  const length = structure.length;
  const tagVariety = new Set(structure).size;
  const tagPenalty = length > 0 ? 1 - Math.min(tagVariety / length, 1) : 0;
  // penalize depth only for large structures
  const depthPenalty = length >= 200 ? Math.min(1, length / 200) : 0;
  const hasLayout = Array.isArray(layout) && layout.length > 0;
  const layoutVariety = hasLayout ? new Set(layout).size : 0;
  const layoutPenalty = hasLayout ? 1 - Math.min(layoutVariety / layout.length, 1) : 0;

  const penalties = [tagPenalty, depthPenalty, layoutPenalty];
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