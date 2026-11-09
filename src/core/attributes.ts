import { DomHashOptions } from '../types';
import { normalizeAttributeValue } from './attributeValues';

/**
 * Shared attribute-token logic used by both canonicalization paths, so the
 * filtering, sorting, and value-inclusion rules can never drift apart.
 *
 * Builds the space-separated attribute string for the canonical form:
 * lowercased and sorted names, with an optional normalized `name~value`
 * token for attributes listed in `includeAttributeValues`.
 *
 * @param attrs - Attribute name/value pairs (original casing)
 * @param options - DomHashOptions controlling filtering and value inclusion
 * @returns Space-separated attribute tokens, or '' when none remain
 */
export function canonicalAttributeTokens(
  attrs: ReadonlyArray<readonly [string, string]>,
  options: DomHashOptions
): string {
  const includeAttrs = options.includeAttributes?.map(a => a.toLowerCase()) || [];
  const includeValues = new Set(
    (options.includeAttributeValues || []).map(a => a.toLowerCase())
  );

  return attrs
    .map(([name]) => name.toLowerCase())
    .filter(name => {
      if (!options.includeDataAndAriaAttributes && (name.startsWith('data-') || name.startsWith('aria-'))) return false;
      if (includeAttrs.length > 0) return includeAttrs.includes(name);
      return true;
    })
    .sort()
    .map(name => {
      if (includeValues.size > 0 && includeValues.has(name)) {
        const attr = attrs.find(a => a[0].toLowerCase() === name);
        const value = attr ? normalizeAttributeValue(attr[1]) : '';
        if (value !== '') return `${name}~${value}`;
      }
      return name;
    })
    .join(' ');
}
