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
  // Split canonical strings into tags and text segments for diffing
  const tokenize = (str: string): string[] => {
    return str
      .split(/(<[^>]+>[^<]*<\/[\s\S]*?>|<[^>]+>)/g)
      .filter(token => token.trim() !== '');
  };
  const aLines = tokenize(a);
  const bLines = tokenize(b);
  const diff: string[] = [];
  const max = Math.max(aLines.length, bLines.length);

  for (let i = 0; i < max; i++) {
    const aTok = aLines[i] || '';
    const bTok = bLines[i] || '';
    if (aTok !== bTok) {
      if (aTok) diff.push(`- ${aTok}`);
      if (bTok) diff.push(`+ ${bTok}`);
    } else if (aTok) {
      diff.push(`  ${aTok}`);
    }
  }
  return diff;
}