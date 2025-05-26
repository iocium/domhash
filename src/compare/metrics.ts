export function compareStructures(a: string, b: string): number {
  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  return maxLen === 0 ? 1 : 1 - dist / maxLen;
}

export function compareShapeVectors(a: string[], b: string[]): number {
  const setA = new Set(a);
  const setB = new Set(b);
  const intersection = [...setA].filter(tag => setB.has(tag));
  const union = new Set([...a, ...b]);
  return union.size === 0 ? 1 : intersection.length / union.size;
}

export function compareShapeLCS(a: string[], b: string[]): number {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return Math.max(m, n) === 0 ? 1 : dp[m][n] / Math.max(m, n);
}

export function compareShapeCosine(a: string[], b: string[]): number {
  const freq = (arr: string[]) => {
    const map = new Map<string, number>();
    for (const tag of arr) map.set(tag, (map.get(tag) || 0) + 1);
    return map;
  };
  const freqA = freq(a);
  const freqB = freq(b);
  const allTags = new Set([...freqA.keys(), ...freqB.keys()]);
  let dot = 0, magA = 0, magB = 0;
  for (const tag of allTags) {
    const x = freqA.get(tag) || 0;
    const y = freqB.get(tag) || 0;
    dot += x * y;
    magA += x * x;
    magB += y * y;
  }
  if (magA === 0 || magB === 0) return 1;
  return dot / (Math.sqrt(magA) * Math.sqrt(magB));
}

export function compareTreeEditDistance(a: string[], b: string[]): number {
  const dist = levenshtein(a.join(','), b.join(','));
  const maxLen = Math.max(a.length, b.length);
  return maxLen === 0 ? 1 : 1 - dist / maxLen;
}

export function compareLayoutVectors(a: string[], b: string[]): number {
  return compareShapeVectors(a, b);
}

function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  const dp = new Array(n + 1).fill(0).map((_, j) => j);
  for (let i = 1; i <= m; i++) {
    let prev = dp[0];
    dp[0] = i;
    for (let j = 1; j <= n; j++) {
      const temp = dp[j];
      dp[j] = a[i - 1] === b[j - 1] ? prev : Math.min(prev + 1, dp[j] + 1, dp[j - 1] + 1);
      prev = temp;
    }
  }
  return dp[n];
}