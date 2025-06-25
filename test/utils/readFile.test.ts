import { readFile } from '../../src/utils/readFile';
import * as fs from 'fs';
import * as path from 'path';

describe('readFile', () => {
  it('returns the input if it is HTML content', async () => {
    const input = '<p>hello</p>';
    const result = await readFile(input);
    expect(result).toBe(input);
  });

  it('reads content from a file path', async () => {
    const tmpFile = path.resolve(__dirname, 'test.html');
    const html = '<div>x</div>';
    fs.writeFileSync(tmpFile, html, 'utf8');
    const result = await readFile(tmpFile);
    expect(result).toBe(html);
    fs.unlinkSync(tmpFile);
  });

  it('throws an error for missing files', async () => {
    await expect(readFile('nonexistent.file')).rejects.toThrow(/^Failed to read input:/);
  });
  
  describe('fetch support', () => {
    let originalFetch: any;
    beforeAll(() => {
      originalFetch = (global as any).fetch;
      (global as any).fetch = jest.fn().mockResolvedValue({
        ok: true,
        text: async () => '<div>from fetch</div>',
      });
    });
    afterAll(() => {
      (global as any).fetch = originalFetch;
    });

    it('fetches content from a URL', async () => {
      const result = await readFile('https://example.com');
      expect((global as any).fetch).toHaveBeenCalledWith('https://example.com');
      expect(result).toBe('<div>from fetch</div>');
    });

    it('throws error on non-ok fetch response', async () => {
      (global as any).fetch = jest.fn().mockResolvedValue({ ok: false, status: 500 });
      await expect(readFile('https://error.com')).rejects.toThrow(/Failed to read input: Fetch failed: 500/);
    });
  });
  
  describe('Bun file support', () => {
    it('uses Bun.file when available', async () => {
      (global as any).Bun = {
        file: (filePath: string) => {
          void filePath;
          return {
            text: async () => '<bun-content>'
          };
        }
      };
      const result = await readFile('any-path');
      expect(result).toBe('<bun-content>');
      delete (global as any).Bun;
    });
  });
});