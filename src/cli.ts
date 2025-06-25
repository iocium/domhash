import { Command } from 'commander';
import { readFile } from './utils/readFile';
import { domhash } from './index';
import {
  compareStructures,
  compareShapeJaccard,
  compareShapeLCS,
  compareShapeCosine,
  compareTreeEditDistance,
  compareLayoutVectors
} from './compare/metrics';
import { formatResult, getStructuralDiff } from './format';
import pkg from '../package.json';

const program = new Command();

program
  .name('domhash')
  .version(pkg.version)
  .argument('<input>', 'HTML string, file path, or URL')
  .option('-i, --include-attrs <attrs>', 'Comma-separated list of attributes to include', parseAttrList)
  .option('-a, --algorithm <type>', 'Hashing algorithm: sha256, murmur3, blake3, simhash, minhash (default: sha256)', 'sha256')
  .option('-s, --shape-vector', 'Output compressed shape vector (run-length encoded)', false)
  .option('-m, --shape-metric <type>', 'Shape (and layout) similarity metric: jaccard (default), lcs, cosine, ted', 'jaccard')
  .option('-l, --layout-aware', 'Enable layout-aware hashing', false)
  .option('-r, --resilience', 'Output resilience score with detailed penalties', false)
  .option('-c, --compare-with <inputB>', 'Second input (HTML string, file path, or URL) to compare against')
  .option('-d, --diff', 'Show structural diff between inputs', false)
  .option('-o, --output <format>', 'Output format: json, markdown, html')
  .parse();

(async () => {
  const opts = program.opts();
  const [inputA] = program.args;

  try {
    const sourceA = await readFile(inputA);
    const resultA = await domhash(sourceA, {
      algorithm: opts.algorithm,
      includeAttributes: opts.includeAttrs,
      shapeVector: opts.shapeVector,
      layoutAware: opts.layoutAware,
      resilience: opts.resilience
    });

    if (!opts.compareWith) {
      console.log('Hash:', resultA.hash);
      if (opts.shapeVector && resultA.shape) {
        console.log('Shape:', JSON.stringify(resultA.shape));
      }
      if (opts.layoutAware && resultA.layoutShape) {
        console.log('Layout Shape:', JSON.stringify(resultA.layoutShape));
        console.log('Layout Hash:', resultA.layoutHash);
      }
      if (opts.resilience && resultA.resilienceScore !== undefined) {
        console.log(`Resilience: ${resultA.resilienceEmoji} ${resultA.resilienceLabel} (${(resultA.resilienceScore * 100).toFixed(2)}%)`);
        console.log('Breakdown:', {
          tagPenalty: (resultA.resilienceBreakdown?.tagPenalty * 100).toFixed(1) + '%',
          depthPenalty: (resultA.resilienceBreakdown?.depthPenalty * 100).toFixed(1) + '%',
          layoutPenalty: (resultA.resilienceBreakdown?.layoutPenalty * 100).toFixed(1) + '%'
        });
      }
      return;
    }

    const sourceB = await readFile(opts.compareWith);
    const resultB = await domhash(sourceB, {
      algorithm: opts.algorithm,
      includeAttributes: opts.includeAttrs,
      shapeVector: opts.shapeVector,
      layoutAware: opts.layoutAware
    });

    const structural = compareStructures(resultA.canonical, resultB.canonical);
    let shapeSimilarity: number | undefined;
    if (resultA.shape && resultB.shape) {
      switch (opts.shapeMetric) {
        case 'jaccard':
          shapeSimilarity = compareShapeJaccard(resultA.shape, resultB.shape);
          break;
        case 'lcs':
          shapeSimilarity = compareShapeLCS(resultA.shape, resultB.shape);
          break;
        case 'cosine':
          shapeSimilarity = compareShapeCosine(resultA.shape, resultB.shape);
          break;
        case 'ted':
          shapeSimilarity = compareTreeEditDistance(resultA.shape, resultB.shape);
          break;
        default:
          throw new Error(`Unknown shape similarity metric: ${opts.shapeMetric}`);
      }
    } else {
      shapeSimilarity = undefined;
    }

    const comparison = {
      hashA: resultA.hash,
      hashB: resultB.hash,
      similarity: structural,
      shapeSimilarity,
      diff: opts.diff ? getStructuralDiff(resultA.canonical, resultB.canonical) : undefined
    };

    if (opts.layoutAware && resultA.layoutShape && resultB.layoutShape) {
      const layoutSim = compareLayoutVectors(
        resultA.layoutShape,
        resultB.layoutShape,
        opts.shapeMetric
      );
      const labelMap: Record<string, string> = {
        jaccard: 'Jaccard',
        lcs: 'LCS',
        cosine: 'Cosine',
        ted: 'Tree Edit Distance'
      };
      const label = labelMap[opts.shapeMetric] || opts.shapeMetric;
      console.log(`Layout similarity (${label}):`, (layoutSim * 100).toFixed(2) + '%');
    }

    if (opts.output) {
      console.log(formatResult(comparison, opts.output));
    } else {
      console.log('Structural similarity:', (structural * 100).toFixed(2) + '%');
      if (shapeSimilarity !== undefined) {
        const labelMap: Record<string,string> = {
          jaccard: 'Jaccard',
          lcs: 'LCS',
          cosine: 'Cosine',
          ted: 'Tree Edit Distance'
        };
        const label = labelMap[opts.shapeMetric] || opts.shapeMetric;
        console.log(`Shape similarity (${label}):`, (shapeSimilarity * 100).toFixed(2) + '%');
      }
      if (opts.diff && comparison.diff) {
        console.log('\nStructural Diff:');
        for (const line of comparison.diff) {
          console.log(line);
        }
      }
    }

  } catch (err: any) {
    console.error('Error:', err.message);
    process.exit(1);
  }
})();

/**
 * Parses a comma-separated string of attributes into an array of trimmed strings.
 *
 * This function takes a string containing multiple attributes separated by commas,
 * trims whitespace from each attribute, and filters out any empty values. 
 * It is useful for converting a list of attributes provided as a single string
 * into a more manageable array format.
 *
 * @param val - A comma-separated string of attributes to be parsed.
 *              Each attribute can have leading or trailing whitespace.
 * @returns An array of strings, where each string is a trimmed attribute 
 *          from the input. Empty values are excluded from the output array.
 * 
 * @example
 * ```typescript
 * const attrs = parseAttrList("  attr1,   attr2 ,attr3,,  ");
 * console.log(attrs); // Outputs: ["attr1", "attr2", "attr3"]
 * ```
 */
function parseAttrList(val: string): string[] {
  return val.split(',').map(v => v.trim()).filter(Boolean);
}