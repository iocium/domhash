import { DomHashOptions } from '../types';
import { Parser } from 'htmlparser2';

/**
 * Canonicalize HTML string directly via htmlparser2 for speed.
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
  const parts: string[] = [];

  const parser = new Parser({
    onopentag(name, attribs) {
      const tag = name.toLowerCase();
      shape.push(tag);
      tagCount++;
      maxDepth = Math.max(maxDepth, depth);
      depth++;
      const rawAttrs = Object.keys(attribs)
        .map(n => n.toLowerCase())
        .filter(n => {
          if (!options.includeDataAndAriaAttributes && (n.startsWith('data-') || n.startsWith('aria-'))) return false;
          if (includeAttrs.length > 0) return includeAttrs.includes(n);
          return true;
        })
        .sort();
      const attrStr = rawAttrs.join(' ');
      parts.push(`<${tag}${attrStr ? ' ' + attrStr : ''}>`);
    },
    ontext(text) {
      const t = text.trim();
      if (t) {
        parts.push(t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
      }
    },
    onclosetag(name) {
      depth--;
      const tag = name.toLowerCase();
      parts.push(`</${tag}>`);
    }
  }, { decodeEntities: true });
  parser.write(html);
  parser.end();

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