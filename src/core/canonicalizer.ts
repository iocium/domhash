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
  function traverse(node: Element, depth: number): StructureNode {
    const tag = node.tagName.toLowerCase();
    shape.push(tag);
    tagCount++;
    maxDepth = Math.max(maxDepth, depth);

    const rawAttrs = Array.from(node.attributes)
      .map(attr => attr.name.toLowerCase())
      .filter(name => {
        // optionally exclude data-* and aria-* attributes
        if (!options.includeDataAndAriaAttributes && (name.startsWith('data-') || name.startsWith('aria-'))) {
          return false;
        }
        // if includeAttributes list is provided, only include those attributes
        if (includeAttrs.length > 0) {
          return includeAttrs.includes(name);
        }
        return true;
      })
      .sort();

    const children = Array.from(node.children).map(child => traverse(child as Element, depth + 1));
    return { tag, attributes: rawAttrs, children };
  }

  function serialize(node: StructureNode): string {
    const attrStr = node.attributes.join(' ');
    const childrenStr = node.children.map(serialize).join('');
    return `<${node.tag}${attrStr ? ' ' + attrStr : ''}>${childrenStr}</${node.tag}>`;
  }

  const structure = traverse(root, 0);
  const canonical = serialize(structure);
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