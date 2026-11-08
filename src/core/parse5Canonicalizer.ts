import { parse, DefaultTreeAdapterTypes } from 'parse5';
import { DomHashOptions } from '../types';
import { normalizeCanonicalText } from './text';
import { canonicalAttributeTokens } from './attributes';

/**
 * Canonicalize an HTML string directly via parse5.
 *
 * parse5 implements the WHATWG HTML5 tree construction algorithm — the same
 * algorithm browsers (and jsdom) use — so this path builds exactly the same
 * tree (including implicit elements such as `<head>` and `<tbody>`) and
 * therefore produces exactly the same canonical string as the DOM-based
 * `canonicalize` when given a browser/jsdom `Document`.
 */
export interface CanonicalizeResult {
  canonical: string;
  shape: string[];
  tagCount: number;
  depth: number;
}

type P5Node = DefaultTreeAdapterTypes.Node;

export function canonicalizeString(html: string, options: DomHashOptions = {}): CanonicalizeResult {
  const shape: string[] = [];
  let tagCount = 0;
  let maxDepth = 0;
  const parts: string[] = [];

  // Consecutive text nodes are buffered and normalized together, matching
  // the per-logical-text-node semantics of the DOM path.
  let pendingText = '';
  const flushText = (): void => {
    if (pendingText === '') return;
    const normalized = normalizeCanonicalText(pendingText, options.normalizeText);
    pendingText = '';
    if (normalized) parts.push(normalized);
  };

  const traverse = (node: P5Node, depth: number): void => {
    if (node.nodeName === '#text') {
      pendingText += (node as DefaultTreeAdapterTypes.TextNode).value || '';
      return;
    }
    const element = node as Partial<DefaultTreeAdapterTypes.Element>;
    if (!element.tagName) return; // comments, doctypes
    flushText();

    const tag = element.tagName.toLowerCase();
    shape.push(tag);
    tagCount++;
    maxDepth = Math.max(maxDepth, depth);

    const attrStr = canonicalAttributeTokens(
      (element.attrs || []).map(a => [a.name, a.value] as const),
      options
    );
    parts.push(`<${tag}${attrStr ? ' ' + attrStr : ''}>`);

    for (const child of element.childNodes || []) {
      traverse(child as P5Node, depth + 1);
    }
    flushText();
    parts.push(`</${tag}>`);
  };

  const doc = parse(html);
  const root = (doc.childNodes || []).find(n => (n as any).tagName === 'html');
  if (root) {
    traverse(root as P5Node, 0);
  }
  flushText();

  // Run-length encode shape vector
  const compressed: string[] = [];
  let last: string | undefined;
  let count = 0;
  for (const tag of shape) {
    if (tag === last) {
      count++;
    } else {
      if (last !== undefined) {
        compressed.push(count > 1 ? `${last}*${count}` : last);
      }
      last = tag;
      count = 1;
    }
  }
  if (last !== undefined) {
    compressed.push(count > 1 ? `${last}*${count}` : last);
  }
  return { canonical: parts.join(''), shape: compressed, tagCount, depth: maxDepth };
}
