import { extractDOMStructureTree } from '../src/core/structureTree';

describe('extractDOMStructureTree', () => {
  it('captures nested tags and collapse repeats', () => {
    const div = document.createElement('div');
    const span1 = document.createElement('span');
    const span2 = document.createElement('span');
    const span3 = document.createElement('span');
    div.append(span1, span2, span3);
    const tree = extractDOMStructureTree(div);
    expect(tree.tag).toBe('div');
    expect(tree.children).toHaveLength(1);
    const child = tree.children![0];
    expect(child.tag).toBe('span');
    expect(child.repeat).toBe(3);
  });

  it('marks hidden elements when provided a layoutMap', () => {
    const div = document.createElement('div');
    const hidden = document.createElement('span');
    div.appendChild(hidden);
    const map = new Map<Element, boolean>();
    map.set(hidden, true);
    const tree = extractDOMStructureTree(div, map);
    const child = tree.children![0];
    expect(child.tag).toBe('hidden:span');
    expect(child.hidden).toBe(true);
  });
});