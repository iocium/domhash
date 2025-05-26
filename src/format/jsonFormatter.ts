import { DomHashComparisonResult } from './index';

/**
 * Converts the DOM hash comparison results into a JSON string.
 *
 * This function takes a `DomHashComparisonResult` object and serializes it to 
 * a JSON format. The resulting JSON string is properly formatted with indentation 
 * for better readability. This is useful for logging, debugging, or storing 
 * the comparison results in a structured format.
 *
 * @param result - An object containing the results of the DOM hash comparison.
 *                 It should include the following properties:
 *                 - `hashA`: The SHA hash of the first DOM representation.
 *                 - `hashB`: The SHA hash of the second DOM representation.
 *                 - `similarity`: A number representing the structural similarity 
 *                   between the two DOMs (0 to 1).
 *                 - `shapeSimilarity`: (Optional) A number representing the shape 
 *                   similarity between the two DOMs (0 to 1).
 *                 - `diff`: An array of strings representing the structural 
 *                   differences, where lines starting with '+' indicate additions 
 *                   and lines starting with '-' indicate deletions.
 * @returns A string containing the JSON representation of the DOM hash comparison 
 *          results, formatted with 2-space indentation.
 *
 * @example
 * ```typescript
 * const result: DomHashComparisonResult = {
 *   hashA: 'abc123',
 *   hashB: 'def456',
 *   similarity: 0.95,
 *   shapeSimilarity: 0.85,
 *   diff: ['+ New element', '- Removed element']
 * };
 * const jsonOutput = formatAsJSON(result);
 * console.log(jsonOutput); // Outputs the generated JSON string
 * ```
 */
export function formatAsJSON(result: DomHashComparisonResult): string {
  return JSON.stringify(result, null, 2);
}