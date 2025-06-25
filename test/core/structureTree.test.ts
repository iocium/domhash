import { extractDOMStructureTree } from '../../src/core/structureTree';

describe('extractDOMStructureTree', () => {
  it('extracts structure without repeats', () => {
    const root = document.createElement('div');
    const span = document.createElement('span');
    root.appendChild(span);
    const tree = extractDOMStructureTree(root);
    expect(tree.tag).toBe('div');
    expect(tree.children).toHaveLength(1);
    expect(tree.children![0].tag).toBe('span');
    expect(tree.children![0].repeat).toBeUndefined();
  });

  it('collapses repeated identical children with repeat property', () => {
    const root = document.createElement('div');
    const span1 = document.createElement('span');
    const span2 = document.createElement('span');
    root.appendChild(span1);
    root.appendChild(span2);
    const tree = extractDOMStructureTree(root);
    expect(tree.children).toHaveLength(1);
    const child = tree.children![0];
    expect(child.tag).toBe('span');
    expect(child.repeat).toBe(2);
  });

  it('marks hidden property based on layoutMap', () => {
    const root = document.createElement('div');
    const span = document.createElement('span');
    root.appendChild(span);
    const layoutMap = new Map<Element, boolean>();
    layoutMap.set(span, true);
    const tree = extractDOMStructureTree(root, layoutMap);
    expect(tree.children![0].hidden).toBe(true);
    expect(tree.hidden).toBeUndefined();
  });
  it('prefixes hidden tags and collapses consecutive hidden children', () => {
    const root = document.createElement('div');
    const span1 = document.createElement('span');
    const span2 = document.createElement('span');
    root.appendChild(span1);
    root.appendChild(span2);
    const layoutMap = new Map<Element, boolean>();
    layoutMap.set(span1, true);
    layoutMap.set(span2, true);
    const tree = extractDOMStructureTree(root, layoutMap);
    expect(tree.children).toHaveLength(1);
    const child = tree.children![0];
    expect(child.tag).toBe('hidden:span');
    expect(child.hidden).toBe(true);
    expect(child.repeat).toBe(2);
  });
});