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

  function traverse(node: Element, depth: number): StructureNode {
    const tag = node.tagName.toLowerCase();
    shape.push(tag);
    tagCount++;
    maxDepth = Math.max(maxDepth, depth);

    const rawAttrs = Array.from(node.attributes)
      .map(attr => attr.name.toLowerCase())
      .filter(name => {
        if (!options.includeDataAndAriaAttributes) {
          if (name.startsWith('data-') || name.startsWith('aria-')) return false;
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

  return { canonical, shape, tagCount, depth: maxDepth };
}