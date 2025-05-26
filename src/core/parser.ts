import { InputSource } from '../types';

/**
 * Parses the input source (HTML string, DOM, or URL) into an Element.
 * Tries DOMParser (browser), linkedom (Node/Workers), or HTMLRewriter (Cloudflare Workers).
 */
export async function parseInput(input: InputSource): Promise<Element> {
  if (typeof input === 'string') {
    if (input.trim().startsWith('<')) {
      return await parseHtml(input);
    } else {
      const res = await fetch(input);
      const html = await res.text();
      return await parseHtml(html);
    }
  }
  if (input instanceof URL) {
    const res = await fetch(input.toString());
    const html = await res.text();
    return await parseHtml(html);
  }
  if ('nodeType' in input && (input.nodeType === 1 || input.nodeType === 9)) {
    return input.nodeType === 9 ? (input as Document).documentElement : input as Element;
  }
  throw new Error('Unsupported input type');
}

async function parseHtml(html: string): Promise<Element> {
  // Browser environment
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (!doc.documentElement) throw new Error('Failed to parse HTML');
    return doc.documentElement;
  }

  // Cloudflare Workers: use HTMLRewriter to simulate a pseudo-root
  if (typeof HTMLRewriter !== 'undefined') {
    const root = { tagName: 'html', children: [], appendChild: () => {} } as any;
    const el = root;
    const rewriter = new HTMLRewriter()
      .on('*', {
        element(e) {
          const tag = e.tagName.toLowerCase();
          const mock = { tagName: tag, children: [], getAttribute: () => null };
          el.children.push(mock);
        }
      });
    await rewriter.transform(new Response(html)).arrayBuffer();
    return root;
  }

  // Node.js fallback
  try {
    const { DOMParser: LinkeDOMParser } = await import('linkedom');
    const result = new LinkeDOMParser().parseFromString(html, 'text/html');
    return result.documentElement;
  } catch (err: any) {
    console.error('Failed to import linkedom:', err);
    throw new Error('No HTML parser available in this environment');
  }
}