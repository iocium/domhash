import { DomHashOptions } from '../types';
import { normalizeCanonicalText } from './text';
import { normalizeAttributeValue } from './attributeValues';

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
  const includeValues = new Set(
    (options.includeAttributeValues || []).map(a => a.toLowerCase())
  );
  const parts: string[] = [];

  function attributeTokens(node: Element): string {
    const attrs = Array.from(node.attributes).map(
      attr => [attr.name.toLowerCase(), attr.value] as const
    );
    const names = attrs
      .map(([name]) => name)
      .filter(name => {
        if (!options.includeDataAndAriaAttributes && (name.startsWith('data-') || name.startsWith('aria-'))) return false;
        if (includeAttrs.length > 0) return includeAttrs.includes(name);
        return true;
      })
      .sort();

    return names
      .map(name => {
        if (includeValues.size > 0 && includeValues.has(name)) {
          const attr = attrs.find(a => a[0] === name);
          const value = attr ? normalizeAttributeValue(attr[1]) : '';
          if (value !== '') return `${name}~${value}`;
        }
        return name;
      })
      .join(' ');
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
