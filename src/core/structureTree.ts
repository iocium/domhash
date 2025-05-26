export interface DOMNodeShape {
  tag: string;
  hidden?: boolean;
  children?: DOMNodeShape[];
  repeat?: number;
}

export function extractDOMStructureTree(el: Element, layoutMap?: Map<Element, boolean>): DOMNodeShape {
  const tag = el.tagName.toLowerCase();
  const hidden = layoutMap?.get(el) || false;

  const children: DOMNodeShape[] = [];
  for (const child of Array.from(el.children)) {
    children.push(extractDOMStructureTree(child as Element, layoutMap));
  }

  // collapse repeated identical children
  const compressed: DOMNodeShape[] = [];
  let i = 0;
  while (i < children.length) {
    const current = children[i];
    let count = 1;
    while (
      i + count < children.length &&
      JSON.stringify(children[i + count]) === JSON.stringify(current)
    ) {
      count++;
    }
    const entry = { ...current };
    if (count > 1) entry.repeat = count;
    compressed.push(entry);
    i += count;
  }

  return {
    tag,
    hidden: hidden || undefined,
    children: compressed.length > 0 ? compressed : undefined,
  };
}