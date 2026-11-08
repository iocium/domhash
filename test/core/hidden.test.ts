import { describe, expect, it } from 'bun:test';
import {
  extractLayoutFeatures,
  isHiddenByStyle,
  parseInlineStyle,
} from '../../src/core/layout';

describe('parseInlineStyle', () => {
  it('parses declarations into a lowercased map', () => {
    expect(parseInlineStyle('Display: NONE; opacity:0.5')).toEqual({
      display: 'NONE',
      opacity: '0.5',
    });
  });

  it('ignores malformed declarations', () => {
    expect(parseInlineStyle(';; color:red ; no-colon ;')).toEqual({ color: 'red' });
  });
});

describe('isHiddenByStyle (unit)', () => {
  const hiddenCases: Record<string, string>[] = [
    { display: 'none' },
    { visibility: 'hidden' },
    { visibility: 'collapse' },
    { opacity: '0' },
    { opacity: '0.0' },
    { 'font-size': '0' },
    { 'font-size': '0px' },
    { width: '0' },
    { height: '0px' },
    { clip: 'rect(0, 0, 0, 0)' },
    { clip: 'RECT(0px,0px,0px,0px)' },
    { 'clip-path': 'inset(50%)' },
    { 'clip-path': 'inset( 50% 50% 50% 50% )' },
    { transform: 'scale(0)' },
    { transform: 'translate(1px) scale(0.0)' },
    { transform: 'scale3d(0, 1, 1)' },
    { 'content-visibility': 'hidden' },
    { left: '-9999px' },
    { top: '-10000px' },
    { left: '-99999px' },
  ];

  for (const style of hiddenCases) {
    it(`flags ${JSON.stringify(style)}`, () => {
      expect(isHiddenByStyle(style)).toBe(true);
    });
  }

  const visibleCases: Record<string, string>[] = [
    {},
    { display: 'block' },
    { display: 'inline' },
    { opacity: '0.5' },
    { 'font-size': '12px' },
    { width: '100px', height: '50px' },
    { position: 'absolute', left: '-100px' },
    { transform: 'scale(1)' },
    { 'content-visibility': 'visible' },
  ];

  for (const style of visibleCases) {
    it(`does not flag ${JSON.stringify(style)}`, () => {
      expect(isHiddenByStyle(style)).toBe(false);
    });
  }

  it('detects mixed declarations', () => {
    expect(isHiddenByStyle(parseInlineStyle('position:absolute; left:-9999px; width:10px'))).toBe(true);
    expect(isHiddenByStyle(parseInlineStyle('color:red; margin:0'))).toBe(false);
  });
});

describe('extractLayoutFeatures hidden detection (integration)', () => {
  function featureFor(style: string) {
    const { document } = globalThis as any;
    const div = document.createElement('div');
    if (style) div.setAttribute('style', style);
    const span = document.createElement('span');
    span.setAttribute('style', style);
    div.appendChild(span);
    const features = extractLayoutFeatures(div);
    return features;
  }

  const HIDDEN_STYLES = [
    'display:none;',
    'visibility:hidden;',
    'opacity:0;',
    'width:0;height:0;overflow:hidden;',
    'font-size:0;',
    'position:absolute;left:-9999px;',
    'clip:rect(0,0,0,0);',
    'clip-path:inset(50%);',
    'transform:scale(0);',
    'content-visibility:hidden;',
  ];

  for (const style of HIDDEN_STYLES) {
    it(`marks inline style as hidden: ${style}`, () => {
      const [divF, spanF] = featureFor(style);
      expect(divF.isHidden).toBe(true);
      expect(spanF.isHidden).toBe(true);
    });
  }

  it('does not mark visible styles as hidden', () => {
    const [divF] = featureFor('color:red; margin:4px;');
    expect(divF.isHidden).toBe(false);
    // span with no inline style falls back to computed style: visible
    const features = featureFor('');
    expect(features.every(f => f.isHidden === false)).toBe(true);
  });

  it('serializes hidden features with the H suffix', () => {
    const features = featureFor('display:none;');
    const serialized = features
      .map(f => `${f.tag}:${f.isHidden ? 'H' : 'V'}`)
      .join(',');
    expect(serialized).toBe('div:H,span:H');
  });
});
