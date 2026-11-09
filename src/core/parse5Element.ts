import { DefaultTreeAdapterTypes, serializeOuter } from 'parse5';

type P5Node = DefaultTreeAdapterTypes.Node;
type P5Element = DefaultTreeAdapterTypes.Element;

/**
 * Minimal DOM `Element`-compatible view over a parse5 node.
 *
 * In environments without a DOM (plain Node.js), `parseInput` falls back to
 * parse5. The library's walkers (`canonicalize`, `extractLayoutFeatures`,
 * `extractDOMStructureTree`) are written against the DOM Element interface,
 * so this adapter exposes exactly the surface they need:
 *
 * - `nodeType`, `tagName` (upper-cased, DOM convention), `textContent`,
 *   `outerHTML`, `firstChild`
 * - `attributes` (array of `{name, value}`), `getAttribute` (case-insensitive)
 * - `childNodes` (elements + text), `children` (elements only)
 * - `querySelector` for simple selectors: `tag`, `#id`, `.class`, and
 *   combinations like `tag#id.class`
 *
 * It is deliberately not a full DOM implementation; advanced consumers of
 * `parseInput` in plain Node should treat the result as this minimal surface.
 */
export class Parse5Element {
  constructor(private readonly node: P5Element) {}

  get nodeType(): number {
    return 1;
  }

  get tagName(): string {
    return this.node.tagName.toUpperCase();
  }

  get textContent(): string {
    let out = '';
    const walk = (n: P5Node): void => {
      if (n.nodeName === '#text') {
        out += (n as DefaultTreeAdapterTypes.TextNode).value || '';
        return;
      }
      for (const child of (n as P5Element).childNodes || []) walk(child as P5Node);
    };
    walk(this.node);
    return out;
  }

  get outerHTML(): string {
    return serializeOuter(this.node);
  }

  get attributes(): Array<{ name: string; value: string }> {
    return (this.node.attrs || []).map(a => ({ name: a.name, value: a.value }));
  }

  get childNodes(): Array<Parse5Element | Parse5Text> {
    const out: Array<Parse5Element | Parse5Text> = [];
    for (const child of this.node.childNodes || []) {
      if (child.nodeName === '#text') {
        out.push(new Parse5Text(child as DefaultTreeAdapterTypes.TextNode));
      } else if ((child as P5Element).tagName) {
        out.push(new Parse5Element(child as P5Element));
      }
      // comments and doctypes are not exposed, matching how the walkers
      // treat them (they only act on nodeType 1 and 3)
    }
    return out;
  }

  get children(): Parse5Element[] {
    return (this.childNodes as Array<Parse5Element | Parse5Text>)
      .filter((n): n is Parse5Element => n instanceof Parse5Element);
  }

  get firstChild(): Parse5Element | Parse5Text | null {
    return this.childNodes[0] || null;
  }

  getAttribute(name: string): string | null {
    const lower = name.toLowerCase();
    const attr = (this.node.attrs || []).find(a => a.name.toLowerCase() === lower);
    return attr ? attr.value : null;
  }

  /**
   * Simple-selector querySelector: `tag`, `#id`, `.class`, and combinations
   * such as `tag#id.class`. Returns the first match in document order.
   * Unsupported selector syntax returns null.
   */
  querySelector(selector: string): Parse5Element | null {
    const m = selector
      .trim()
      .match(/^([a-zA-Z][a-zA-Z0-9-]*)?(?:#([\w-]+))?(?:\.([\w-]+))?$/);
    if (!m || (m[1] === undefined && m[2] === undefined && m[3] === undefined)) {
      return null;
    }
    const tag = m[1] ? m[1].toLowerCase() : null;
    const id = m[2] || null;
    const cls = m[3] || null;
    return this.matchesAndFind(tag, id, cls);
  }

  private matches(el: Parse5Element, tag: string | null, id: string | null, cls: string | null): boolean {
    if (tag && el.tagName.toLowerCase() !== tag) return false;
    if (id && el.getAttribute('id') !== id) return false;
    if (cls && !(el.getAttribute('class') || '').split(/\s+/).includes(cls)) return false;
    return true;
  }

  private matchesAndFind(tag: string | null, id: string | null, cls: string | null): Parse5Element | null {
    for (const child of this.children) {
      if (this.matches(child, tag, id, cls)) return child;
      const found = child.matchesAndFind(tag, id, cls);
      if (found) return found;
    }
    return null;
  }
}

/** Minimal DOM `Text`-compatible view over a parse5 text node. */
export class Parse5Text {
  constructor(private readonly node: DefaultTreeAdapterTypes.TextNode) {}

  get nodeType(): number {
    return 3;
  }

  get textContent(): string {
    return this.node.value || '';
  }
}
