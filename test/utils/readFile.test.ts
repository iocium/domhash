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
});