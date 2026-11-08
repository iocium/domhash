/**
 * Shared text normalization for canonicalization.
 *
 * Both canonicalization paths (the htmlparser2 string fast path and the DOM
 * traversal) must apply this exact pipeline to text nodes. Keeping the logic
 * here, in one place, guarantees that the same document produces the same
 * canonical text (and therefore the same hash) regardless of which path
 * parsed it.
 */

/**
 * Zero-width and invisible formatting characters that change the raw string
 * without changing what the page looks like. Attackers can use them to make
 * visually identical pages hash differently.
 */
const INVISIBLE_CHARS = /[\u200B-\u200F\u202A-\u202E\u2060-\u2064\uFEFF]/g;

/**
 * Escape text for inclusion in the canonical string.
 * @param text - Raw (already decoded) text
 * @returns Text with `&`, `<`, and `>` escaped
 */
export function escapeCanonicalText(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Normalize a raw text node for canonicalization.
 *
 * Strict mode (default): trims surrounding whitespace and escapes. This
 * preserves the historical hashing behavior for plain text.
 *
 * Perceptual mode (`normalize === true`): additionally applies Unicode NFKC
 * normalization, removes invisible/zero-width characters, and collapses
 * internal whitespace runs to a single space. Use this when comparing
 * visually equivalent pages that may differ in formatting or contain
 * adversarial invisible characters.
 *
 * @param text - Raw text from the parsed document (entities already decoded)
 * @param normalize - When true, apply perceptual normalization
 * @returns Normalized, escaped text. Empty string when nothing remains.
 */
export function normalizeCanonicalText(text: string, normalize = false): string {
  let t = text;
  if (normalize) {
    t = t.normalize('NFKC');
    t = t.replace(INVISIBLE_CHARS, '');
    t = t.replace(/\s+/g, ' ');
  }
  t = t.trim();
  if (t === '') return '';
  return escapeCanonicalText(t);
}
