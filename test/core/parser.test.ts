import { parseInput } from '../../src/core/parser';

describe('parseInput', () => {
  it('returns the same element when passed an Element', async () => {
    const div = document.createElement('div');
    const el = await parseInput(div);
    expect(el).toBe(div);
  });

  it('returns documentElement when passed a Document', async () => {
    const doc = document;
    const el = await parseInput(doc);
    expect(el).toBe(doc.documentElement);
  });

  it('parses HTML string into a documentElement', async () => {
    const el = await parseInput('<div><span>hi</span></div>');
    expect(el.tagName.toLowerCase()).toBe('html');
    expect(el.querySelector('span')?.textContent).toBe('hi');
  });

  it('throws for unsupported input types', async () => {
    await expect(parseInput(123 as any)).rejects.toThrow();
  });
  
  describe('fetchWithProxy HTTP errors', () => {
    let originalFetch: any;
    beforeAll(() => {
      originalFetch = (global as any).fetch;
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        text: jest.fn(),
      });
    });
    afterAll(() => {
      (global as any).fetch = originalFetch;
    });
    it('throws an error when fetch response is not ok', async () => {
      await expect(parseInput('http://example.com')).rejects.toThrow(
        'Failed to fetch http://example.com: 404 Not Found'
      );
    });
  
  describe('fetch and URL support', () => {
    let originalFetch: any;
    beforeAll(() => {
      originalFetch = (global as any).fetch;
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: async () => '<span>fetched</span>',
      });
    });
    afterAll(() => {
      (global as any).fetch = originalFetch;
    });

    it('fetches HTML string from URL string and parses HTML', async () => {
      const el = await parseInput('http://example.com');
      expect((global as any).fetch).toHaveBeenCalledWith('http://example.com');
      expect(el.querySelector('span')?.textContent).toBe('fetched');
    });

    it('fetches HTML string from URL object and parses HTML', async () => {
      const urlObj = new URL('http://example.com');
      const el = await parseInput(urlObj);
      expect((global as any).fetch).toHaveBeenCalledWith(urlObj.toString());
      expect(el.querySelector('span')?.textContent).toBe('fetched');
    });

    it('prepends corsProxy when provided', async () => {
      const urlObj = new URL('http://example.com');
      const el = await parseInput(urlObj, { corsProxy: 'proxy/' });
      expect((global as any).fetch).toHaveBeenCalledWith('proxy/' + urlObj.toString());
      expect(el.querySelector('span')?.textContent).toBe('fetched');
    });
  });
  });
  describe('parseHtml via linkedom fallback', () => {
    let originalDOMParser: any;
    beforeAll(() => {
      originalDOMParser = (global as any).DOMParser;
      delete (global as any).DOMParser;
    });
    afterAll(() => {
      (global as any).DOMParser = originalDOMParser;
    });
    it('parses HTML using linkedom when DOMParser and HTMLRewriter are unavailable', async () => {
      const el = await parseInput('<div><span>link</span></div>');
      expect(el.tagName.toLowerCase()).toBe('html');
      expect(el.querySelector('span')?.textContent).toBe('link');
    });
  });
  
});