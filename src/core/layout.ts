export interface LayoutFeature {
  tag: string;
  display: string;
  visibility?: string;
  opacity?: string;
  position?: string;
  isHidden?: boolean;
}

/**
 * Parse an inline `style` attribute into a property map with lowercased
 * property names and trimmed values.
 */
export function parseInlineStyle(style: string): Record<string, string> {
  const map: Record<string, string> = {};
  for (const decl of style.split(';')) {
    const idx = decl.indexOf(':');
    if (idx === -1) continue;
    const name = decl.slice(0, idx).trim().toLowerCase();
    const value = decl.slice(idx + 1).trim();
    if (name) map[name] = value;
  }
  return map;
}

function cssNumber(value: string | undefined): number | null {
  if (value === undefined) return null;
  const n = parseFloat(value);
  return Number.isFinite(n) ? n : null;
}

/**
 * Decide whether a set of CSS declarations effectively hides an element.
 *
 * Deliberately broader than `display:none` / `visibility:hidden` /
 * `opacity:0` so that injected content cannot hide itself with the many other
 * techniques that make an element invisible or unreachable:
 *
 * - `display:none`, `visibility:hidden|collapse`, `opacity:0`
 * - `width:0` or `height:0` (zero-area box)
 * - `font-size:0`
 * - `clip:rect(0,0,0,0)` or `clip-path:inset(50%)` (screen-reader-only idiom)
 * - `transform:scale(0)` / `scale3d(0,...)`
 * - `content-visibility:hidden`
 * - off-screen positioning (`left/top/right/bottom` at -9999px or further)
 */
export function isHiddenByStyle(style: Record<string, string>): boolean {
  if (style.display === 'none') return true;
  if (style.visibility === 'hidden' || style.visibility === 'collapse') return true;
  if (cssNumber(style.opacity) === 0) return true;
  if (cssNumber(style['font-size']) === 0) return true;
  if (cssNumber(style.width) === 0 || cssNumber(style.height) === 0) return true;

  const clip = (style.clip || '').replace(/\s+/g, '').toLowerCase();
  if (clip === 'rect(0,0,0,0)' || clip === 'rect(0px,0px,0px,0px)') return true;

  const clipPath = (style['clip-path'] || '').replace(/\s+/g, '').toLowerCase();
  if (clipPath === 'inset(50%)' || clipPath.startsWith('inset(50%')) return true;

  const transform = (style.transform || '').toLowerCase();
  if (/scale(?:3d)?\(\s*0(?:\.0+)?\s*[,)]/.test(transform)) return true;

  if (style['content-visibility'] === 'hidden') return true;

  for (const prop of ['left', 'right', 'top', 'bottom'] as const) {
    const v = style[prop];
    if (!v) continue;
    const trimmed = v.trim();
    if (/px$/.test(trimmed) && cssNumber(trimmed) !== null && cssNumber(trimmed)! <= -9999) {
      return true;
    }
  }

  return false;
}

/**
 * True when the environment has a real layout engine (bounding boxes are
 * meaningful). jsdom and similar DOM stubs report zero-sized boxes for every
 * element, so bounding-box checks must be skipped there.
 */
function layoutAvailable(): boolean {
  try {
    if (typeof document === 'undefined' || !document.documentElement) return false;
    const rect = document.documentElement.getBoundingClientRect();
    return rect.width > 0 || rect.height > 0;
  } catch {
    return false;
  }
}

export function extractLayoutFeatures(root: Element): LayoutFeature[] {
  const features: LayoutFeature[] = [];
  const useRects = layoutAvailable();

  function visit(el: Element): void {
    const tag = el.tagName.toLowerCase();
    let display = 'block';
    let visibility = 'visible';
    let opacity = '1';
    let position = 'static';

    // Parse inline style attribute if present
    const inlineStyle = typeof el.getAttribute === 'function' ? el.getAttribute('style') || '' : '';
    const styleMap = inlineStyle ? parseInlineStyle(inlineStyle) : {};
    if (inlineStyle) {
      display = styleMap.display || display;
      visibility = styleMap.visibility || visibility;
      opacity = styleMap.opacity || opacity;
      position = styleMap.position || position;
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

    let isHidden = isHiddenByStyle(styleMap);

    if (!isHidden && !inlineStyle && typeof getComputedStyle === 'function') {
      try {
        const style = getComputedStyle(el) as any;
        // Computed styles expose properties under different casings per
        // engine (CSSStyleDeclaration accepts both, stubs may not); check both.
        const fontSize = style.fontSize ?? style['font-size'];
        if (cssNumber(fontSize) === 0) {
          isHidden = true;
        } else if (cssNumber(style.width) === 0 || cssNumber(style.height) === 0) {
          isHidden = true;
        } else if ((style.contentVisibility ?? style['content-visibility']) === 'hidden') {
          isHidden = true;
        }
      } catch {}
    }

    if (!isHidden && useRects && typeof el.getBoundingClientRect === 'function') {
      try {
        const rect = el.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) {
          isHidden = true;
        } else if (rect.right <= 0 || rect.bottom <= 0) {
          isHidden = true;
        }
      } catch {}
    }

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
