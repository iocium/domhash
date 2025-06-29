import { DomHashOptions } from '../types';

export interface CanonicalizeResult {
  canonical: string;
  shape: string[];
  tagCount: number;
  depth: number;
}

export function canonicalize(root: Element, options: DomHashOptions = {}): CanonicalizeResult {
  const shape: string[] = [];
  let tagCount = 0;
  let maxDepth = 0;

  const includeAttrs = options.includeAttributes?.map(a => a.toLowerCase()) || [];
  const parts: string[] = [];

  function traverse(node: Element, depth: number): void {
    const tag = node.tagName.toLowerCase();
    shape.push(tag);
    tagCount++;
    maxDepth = Math.max(maxDepth, depth);

    const rawAttrs = Array.from(node.attributes)
      .map(attr => attr.name.toLowerCase())
      .filter(name => {
        if (!options.includeDataAndAriaAttributes && (name.startsWith('data-') || name.startsWith('aria-'))) return false;
        if (includeAttrs.length > 0) return includeAttrs.includes(name);
        return true;
      })
      .sort();

    const attrStr = rawAttrs.join(' ');
    parts.push(`<${tag}${attrStr ? ' ' + attrStr : ''}>`);

    for (const childNode of Array.from(node.childNodes)) {
      if (childNode.nodeType === 1) {
        traverse(childNode as Element, depth + 1);
      } else if (childNode.nodeType === 3) {
        const txt = (childNode.textContent || '');
        if (txt.trim()) {
          parts.push(txt.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
        }
      }
    }

    parts.push(`</${tag}>`);
  }

  traverse(root, 0);
  const canonical = parts.join('');
  const compressedShape: string[] = [];
  let lastTag: string | null = null;
  let runCount = 0;
  for (const tag of shape) {
    if (lastTag === null) {
      lastTag = tag;
      runCount = 1;
    } else if (tag === lastTag) {
      runCount++;
    } else {
      if (runCount > 1) {
        compressedShape.push(`${lastTag}*${runCount}`);
      } else {
        compressedShape.push(lastTag);
      }
      lastTag = tag;
      runCount = 1;
    }
  }
  if (lastTag !== null) {
    if (runCount > 1) {
      compressedShape.push(`${lastTag}*${runCount}`);
    } else {
      compressedShape.push(lastTag);
    }
  }

  return { canonical, shape: compressedShape, tagCount, depth: maxDepth };
}