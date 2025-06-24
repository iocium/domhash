import { InputSource, DomHashOptions } from '../types';

/**
 * Parses a provided input (HTML string, URL, DOM, or Element) into a root Element.
 */
export async function parseInput(input: InputSource, options: DomHashOptions = {}): Promise<Element> {
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
  if (typeof DOMParser !== 'undefined') {
    const doc = new DOMParser().parseFromString(html, 'text/html');
    if (!doc.documentElement) throw new Error('Failed to parse HTML');
    return doc.documentElement;
  }

  if (typeof HTMLRewriter !== 'undefined') {
    const root = { tagName: 'html', children: [], appendChild: () => {} } as any;
    const el = root;
    const rewriter = new HTMLRewriter()
      .on('*', {
        element(e) {
          const tag = e.tagName.toLowerCase();
          const mock = { tagName: tag, children: [], getAttribute: () => null };
          el.children.push(mock);
        },
      });
    await rewriter.transform(new Response(html)).arrayBuffer();
    return root;
  }

  try {
    const { DOMParser: LinkeDOMParser } = await import('linkedom');
    const result = new LinkeDOMParser().parseFromString(html, 'text/html');
    return result.documentElement;
  } catch (err: any) {
    console.error('Failed to import linkedom:', err);
    throw new Error('No HTML parser available in this environment');
  }
}