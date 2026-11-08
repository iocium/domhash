import { DomHashOptions } from '../types';
import { normalizeCanonicalText } from './text';
import { canonicalAttributeTokens } from './attributes';

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

  const parts: string[] = [];

  function attributeTokens(node: Element): string {
    return canonicalAttributeTokens(
      Array.from(node.attributes).map(attr => [attr.name, attr.value] as const),
      options
    );
  }

  function traverse(node: Element, depth: number): void {
    const tag = node.tagName.toLowerCase();
    shape.push(tag);
    tagCount++;
    maxDepth = Math.max(maxDepth, depth);

    const attrStr = attributeTokens(node);
    parts.push(`<${tag}${attrStr ? ' ' + attrStr : ''}>`);

    // Consecutive text nodes are buffered and normalized together: parsers
    // split text at entity boundaries (e.g. "a " + "&" + " b"), and trimming
    // each fragment separately would drop the surrounding spaces.
    let pendingText = '';
    for (const childNode of Array.from(node.childNodes)) {
      if (childNode.nodeType === 1) {
        if (pendingText !== '') {
          const normalized = normalizeCanonicalText(pendingText, options.normalizeText);
          pendingText = '';
          if (normalized) parts.push(normalized);
        }
        traverse(childNode as Element, depth + 1);
      } else if (childNode.nodeType === 3) {
        pendingText += childNode.textContent || '';
      }
    }
    if (pendingText !== '') {
      const normalized = normalizeCanonicalText(pendingText, options.normalizeText);
      if (normalized) parts.push(normalized);
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
