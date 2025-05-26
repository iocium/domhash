function isFetchableURL(input: string): boolean {
  try {
    const url = new URL(input);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

export async function readFile(input: string): Promise<string> {
  try {
    if (input.trim().startsWith('<')) return input;

    if (isFetchableURL(input)) {
      const res = await fetch(input);
      if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
      return await res.text();
    }

    if (typeof Bun !== 'undefined' && Bun.file) {
      return await Bun.file(input).text();
    } else if (typeof require !== 'undefined') {
      const { readFile } = await import('fs/promises');
      return await readFile(input, 'utf8');
    }

    throw new Error('File reading is not supported in this environment');
  } catch (err: any) {
    throw new Error(`Failed to read input: ${err.message}`);
  }
}