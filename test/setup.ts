/**
 * Bun test preload script.
 * Provides a browser-like DOM environment via jsdom so tests can use
 * document / DOMParser / getComputedStyle globals.
 */
import { JSDOM } from 'jsdom';

const { window } = new JSDOM(
  '<!DOCTYPE html><html><head></head><body></body></html>',
  { url: 'http://localhost' }
);

const g = globalThis as any;
g.window = window;
g.document = window.document;
g.DOMParser = window.DOMParser;
g.getComputedStyle = window.getComputedStyle;
g.customElements = window.customElements;
g.HTMLElement = window.HTMLElement;
g.Element = window.Element;
g.Node = window.Node;
g.Document = window.Document;
