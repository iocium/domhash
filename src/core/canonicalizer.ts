import { DomHashOptions, StructureNode } from '../types';

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

  // prepare attribute inclusion list (lowercased) if provided
  const includeAttrs = options.includeAttributes?.map(a => a.toLowerCase()) || [];
  // Recursively build a node representation including text nodes
  function traverse(node: Element, depth: number): any {
    const tag = node.tagName.toLowerCase();
    shape.push(tag);
    tagCount++;
    maxDepth = Math.max(maxDepth, depth);

    // process attributes
    const rawAttrs = Array.from(node.attributes)
      .map(attr => attr.name.toLowerCase())
      .filter(name => {
        if (!options.includeDataAndAriaAttributes && (name.startsWith('data-') || name.startsWith('aria-'))) return false;
        if (includeAttrs.length > 0) return includeAttrs.includes(name);
        return true;
      })
      .sort();

    // process child nodes: elements and text nodes
    const children: any[] = [];
    for (const childNode of Array.from(node.childNodes)) {
      if (childNode.nodeType === 1) { // Element node
        children.push(traverse(childNode as Element, depth + 1));
      } else if (childNode.nodeType === 3) { // Text node
        const txt = (childNode.textContent || '');
        if (txt.trim()) children.push({ text: txt });
      }
    }
    return { tag, attributes: rawAttrs, children };
  }

  // Serialize node representation to HTML-like string, including text
  function serializeNode(node: any): string {
    if ('text' in node) {
      // escape text
      return node.text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    const attrStr = node.attributes.join(' ');
    const childrenStr = node.children.map(serializeNode).join('');
    return `<${node.tag}${attrStr ? ' ' + attrStr : ''}>${childrenStr}</${node.tag}>`;
  }

  const structure = traverse(root, 0);
  const canonical = serializeNode(structure);
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