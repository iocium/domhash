import { readFile } from '../src/utils/readFile';

describe('readFile', () => {
  it('returns raw HTML string when input starts with <', async () => {
    const html = '<div>Test</div>';
    await expect(readFile(html)).resolves.toBe(html);
  });

  it('throws error on nonexistent file path', async () => {
    await expect(readFile('nonexistent.file')).rejects.toThrow(/Failed to read input/);
  });
});