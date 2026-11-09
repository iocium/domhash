import { InputSource, DomHashOptions } from '../types';
import { parse } from 'parse5';
import { Parse5Element } from './parse5Element';
import { DefaultTreeAdapterTypes } from 'parse5';

/**
 * Parses a provided input (HTML string, URL, DOM, or Element) into a root Element.
 */
export async function parseInput(input: InputSource, options: DomHashOptions = {}): Promise<Element> {
  /* istanbul ignore next: puppeteer-based parsing not covered by tests */
  if (options.usePuppeteer) {
    let html: string;
    let browser: any;
    try {
      const puppeteerModule = await import('puppeteer-core');
      const puppeteer = (puppeteerModule as any).default || puppeteerModule;
      if (options.puppeteerConnect && (options.puppeteerConnect.browserWSEndpoint || options.puppeteerConnect.browserURL)) {
        if (options.puppeteerConnect.browserWSEndpoint) {
          browser = await puppeteer.connect({ browserWSEndpoint: options.puppeteerConnect.browserWSEndpoint });
        } else {
          browser = await puppeteer.connect({ browserURL: options.puppeteerConnect.browserURL! });
        }
      } else {
        browser = await puppeteer.launch();
      }
      const page = await browser.newPage();
      if (typeof input === 'string') {
        if (input.trim().startsWith('<')) {
          await page.setContent(input, { waitUntil: 'networkidle0' });
        } else {
          await page.goto(input, { waitUntil: 'networkidle0' });
        }
      } else if (input instanceof URL) {
        await page.goto(input.toString(), { waitUntil: 'networkidle0' });
      } else if ('nodeType' in input && (input.nodeType === 1 || input.nodeType === 9)) {
        const htmlString = input.nodeType === 9
          ? (input as Document).documentElement.outerHTML
          : (input as Element).outerHTML;
        await page.setContent(htmlString, { waitUntil: 'networkidle0' });
      } else {
        throw new Error('Unsupported input type for Puppeteer parsing');
      }
      html = await page.content();
      await page.close();
      if (options.puppeteerConnect) {
        if (typeof browser.disconnect === 'function') {
          browser.disconnect();
        }
      } else {
        await browser.close();
      }
    } catch (err: any) {
      throw new Error(`Puppeteer fetch failed: ${err.message || err}`);
    }
    return await parseHtml(html);
  }
  const fetchWithProxy = async (url: string) => {
    const finalUrl = options.corsProxy ? options.corsProxy + url : url;
    const res = await fetch(finalUrl);
    if (!res.ok) {
      throw new Error(`Failed to fetch ${finalUrl}: ${res.status} ${res.statusText}`);
    }
    return await res.text();
  };

  if (typeof input === 'string') {
    if (input.trim().startsWith('<')) {
      return await parseHtml(input);
    } else {
      const html = await fetchWithProxy(input);
      return await parseHtml(html);
    }
  }
  if (input instanceof URL) {
    const html = await fetchWithProxy(input.toString());
    return await parseHtml(html);
  }
  if ('nodeType' in input && (input.nodeType === 1 || input.nodeType === 9)) {
    return input.nodeType === 9
      ? (input as Document).documentElement
      : (input as Element);
  }
  throw new Error('Unsupported input type');
}

async function parseHtml(html: string): Promise<Element> {
  // Use DOMParser in browser-like environments
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (!doc.documentElement) throw new Error('Failed to parse HTML');
    return doc.documentElement;
  }
  // Node.js fallback: parse5 implements the WHATWG HTML5 tree construction
  // algorithm — the same algorithm browsers (and jsdom) use — so the tree
  // (including implicit elements like <head> and <tbody>) is identical to
  // what a browser DOMParser would produce, and snippets are wrapped into
  // a full document by the tree construction itself. The result is exposed
  // as a minimal DOM Element via Parse5Element.
  const doc = parse(html);
  const root = (doc.childNodes || []).find(n => (n as DefaultTreeAdapterTypes.Element).tagName === 'html');
  if (!root) throw new Error('Failed to parse HTML');
  return new Parse5Element(root as DefaultTreeAdapterTypes.Element) as unknown as Element;
}