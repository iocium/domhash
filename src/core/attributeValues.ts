/**
 * Normalization for attribute *values* included in the canonical string via
 * the `includeAttributeValues` option.
 *
 * By default the canonical string contains attribute *names* only, which lets
 * an attacker rewrite every `href`/`src`/`action` on a page without changing
 * the hash. When callers opt into hashing selected attribute values, the
 * values are normalized here to reduce false differences (host-name case,
 * URL fragments, padded whitespace) while preserving everything that changes
 * which resource the attribute points at.
 */

const SCHEME_URL_LIKE = /^[a-z][a-z0-9+.-]*:\/\//i;

/**
 * Normalize a single attribute value for canonicalization.
 *
 * - Whitespace runs are collapsed and both ends trimmed.
 * - Absolute URLs (`https://x.com/Path`): scheme and host are lowercased
 *   (host case is meaningless), credentials and the fragment are dropped
 *   (the fragment is client-side only), and the path and query are kept as
 *   written (both are case-sensitive and both affect the fetched resource).
 * - Protocol-relative URLs (`//x.com/p`): host is lowercased, fragment
 *   dropped, path and query kept.
 * - Relative URLs and non-URL values: whitespace-collapsed, otherwise kept
 *   as written.
 *
 * @param value - Raw attribute value (entities already decoded)
 * @returns Normalized value, safe to embed in a `name~value` token
 */
export function normalizeAttributeValue(value: string): string {
  const collapsed = value.replace(/\s+/g, ' ').trim();
  if (collapsed === '') return '';

  if (SCHEME_URL_LIKE.test(collapsed)) {
    try {
      const url = new URL(collapsed);
      let out = `${url.protocol.toLowerCase()}//${url.host.toLowerCase()}${url.pathname}`;
      if (url.search) out += url.search;
      return out;
    } catch {
      // Not a parseable URL after all; fall through to plain normalization.
    }
  }

  if (collapsed.startsWith('//')) {
    const rest = collapsed.slice(2);
    const slash = rest.indexOf('/');
    const host = slash === -1 ? rest : rest.slice(0, slash);
    let path = slash === -1 ? '' : rest.slice(slash);
    const hash = path.indexOf('#');
    if (hash !== -1) path = path.slice(0, hash);
    return `//${host.toLowerCase()}${path}`;
  }

  return collapsed;
}
