import { DomHashOptions } from '../types';
import { Parser } from 'htmlparser2';
import { normalizeCanonicalText } from './text';
import { normalizeAttributeValue } from './attributeValues';

/**
 * Canonicalize HTML string directly via htmlparser2 for speed.
 *
 * Text events are buffered and normalized as a whole (see
 * `normalizeCanonicalText` in ./text) so this path produces exactly the same
 * canonical string as the DOM-based `canonicalize` for the same document.
 */
export interface CanonicalizeResult {
  canonical: string;
  shape: string[];
  tagCount: number;
  depth: number;
}

export function canonicalizeString(html: string, options: DomHashOptions = {}): CanonicalizeResult {
  const shape: string[] = [];
  let tagCount = 0;
  let maxDepth = 0;
  let depth = 0;
  const includeAttrs = options.includeAttributes?.map(a => a.toLowerCase()) || [];
  const includeValues = new Set(
    (options.includeAttributeValues || []).map(a => a.toLowerCase())
  );
  const parts: string[] = [];

  // htmlparser2 emits one text event per entity boundary; buffer consecutive
  // text so surrounding whitespace survives normalization, matching the
  // per-text-node semantics of the DOM path.
  let pendingText = '';
  const flushText = (): void => {
    if (pendingText === '') return;
    const normalized = normalizeCanonicalText(pendingText, options.normalizeText);
    pendingText = '';
    if (normalized) parts.push(normalized);
  };

  const parser = new Parser({
    onopentag(name, attribs) {
      flushText();
      const tag = name.toLowerCase();
      shape.push(tag);
      tagCount++;
      maxDepth = Math.max(maxDepth, depth);
      depth++;
      const lower = new Map<string, string>();
      for (const key of Object.keys(attribs)) {
        lower.set(key.toLowerCase(), attribs[key]);
      }
      const attrStr = Object.keys(attribs)
        .map(n => n.toLowerCase())
        .filter(n => {
          if (!options.includeDataAndAriaAttributes && (n.startsWith('data-') || n.startsWith('aria-'))) return false;
          if (includeAttrs.length > 0) return includeAttrs.includes(n);
          return true;
        })
        .sort()
        .map(n => {
          if (includeValues.size > 0 && includeValues.has(n)) {
            const value = normalizeAttributeValue(lower.get(n) || '');
            if (value !== '') return `${n}~${value}`;
          }
          return n;
        })
        .join(' ');
      parts.push(`<${tag}${attrStr ? ' ' + attrStr : ''}>`);
    },
    ontext(text) {
      pendingText += text;
    },
    onclosetag(name) {
      flushText();
      depth--;
      const tag = name.toLowerCase();
      parts.push(`</${tag}>`);
    }
  }, { decodeEntities: true });
  parser.write(html);
  parser.end();
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
