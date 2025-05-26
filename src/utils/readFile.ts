/**
 * Determines if a given string is a valid fetchable URL.
 *
 * This function checks if the input string can be parsed as a URL and 
 * whether it uses either the 'http' or 'https' protocol, which are 
 * considered fetchable by typical web standards.
 *
 * @param input - The string to be evaluated as a URL. It should represent 
 *                a potential URL that you want to validate for fetching.
 * @returns A boolean indicating whether the input string is a valid 
 *          fetchable URL. Returns `true` if the URL is valid and uses 
 *          'http' or 'https', otherwise returns `false`.
 *
 * @example
 * ```typescript
 * console.log(isFetchableURL("https://example.com")); // true
 * console.log(isFetchableURL("ftp://example.com"));    // false
 * console.log(isFetchableURL("invalid-url"));           // false
 * ```
 */
function isFetchableURL(input: string): boolean {
  try {
    const url = new URL(input);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Asynchronously reads the content of a file or fetches data from a URL.
 *
 * This function attempts to read the input string as either a local file path 
 * or a remote URL. If the input starts with a '<', it is returned directly 
 * as it is assumed to be an HTML string. The function supports reading files 
 * using Bun or Node.js, depending on the environment.
 *
 * @param input - A string representing the path to the file or a URL to fetch.
 *                It can also be an HTML string if it starts with '<'.
 * @returns A promise that resolves to the content of the file or the fetched 
 *          data as a string.
 * 
 * @throws {Error} Throws an error if the reading process fails, whether due 
 *                 to an invalid URL, a failed fetch request, or unsupported 
 *                 file reading in the current environment.
 *
 * @example
 * ```typescript
 * const content = await readFile("https://example.com/data.txt");
 * console.log(content); // Outputs the content of the fetched URL
 * 
 * const localContent = await readFile("/path/to/local/file.txt");
 * console.log(localContent); // Outputs the content of the local file
 * 
 * const htmlContent = await readFile("<div>Hello World</div>");
 * console.log(htmlContent); // Outputs: <div>Hello World</div>
 * ```
 */
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