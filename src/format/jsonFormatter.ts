import { DomHashComparisonResult } from './index';

export function formatAsJSON(result: DomHashComparisonResult): string {
  return JSON.stringify(result, null, 2);
}