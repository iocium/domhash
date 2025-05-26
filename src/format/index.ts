import { formatAsJSON } from './jsonFormatter';
import { formatAsMarkdown } from './markdownFormatter';
import { formatAsHTML } from './htmlFormatter';

export interface DomHashComparisonResult {
  hashA: string;
  hashB: string;
  similarity: number;
  shapeSimilarity?: number;
  diff?: string[];
}

export function formatResult(result: DomHashComparisonResult, format: 'json' | 'markdown' | 'html'): string {
  switch (format) {
    case 'json':
      return formatAsJSON(result);
    case 'markdown':
      return formatAsMarkdown(result);
    case 'html':
      return formatAsHTML(result);
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

export function getStructuralDiff(a: string, b: string): string[] {
  const tokenize = (str: string): string[] => str.match(/<[^>]+>(?:<\/[^>]+>)?/g) || [];
  const aLines = tokenize(a);
  const bLines = tokenize(b);
  const diff: string[] = [];
  const max = Math.max(aLines.length, bLines.length);

  for (let i = 0; i < max; i++) {
    if (aLines[i] !== bLines[i]) {
      if (aLines[i]) diff.push(`- ${aLines[i]}`);
      if (bLines[i]) diff.push(`+ ${bLines[i]}`);
    } else if (aLines[i]) {
      diff.push(`  ${aLines[i]}`);
    }
  }
  return diff;
}