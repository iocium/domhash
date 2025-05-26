import { Command } from 'commander';
import { readFile } from './utils/readFile';
import { domhash } from './index';
import {
  compareStructures,
  compareShapeVectors,
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
  .option('--include <attrs>', 'Comma-separated attributes to include', parseAttrList)
  .option('--algo <type>', 'Hashing algorithm (sha256, murmur3, blake3, simhash, minhash)', 'sha256')
  .option('--shape', 'Output shape vector', false)
  .option('--layoutAware', 'Enable layout-aware hashing', false)
  .option('--resilience', 'Enable resilience scoring', false)
  .option('--compare <inputB>', 'Second input for comparison')
  .option('--diff', 'Show structural diff between inputs', false)
  .option('--output <format>', 'Output format: json, markdown, html')
  .parse();

(async () => {
  const opts = program.opts();
  const [inputA] = program.args;

  try {
    const sourceA = await readFile(inputA);
    const resultA = await domhash(sourceA, {
      algorithm: opts.algo,
      includeAttributes: opts.include,
      shapeVector: opts.shape,
      layoutAware: opts.layoutAware,
      resilience: opts.resilience
    });

    if (!opts.compare) {
      console.log('Hash:', resultA.hash);
      if (opts.shape && resultA.shape) {
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

    const sourceB = await readFile(opts.compare);
    const resultB = await domhash(sourceB, {
      algorithm: opts.algo,
      includeAttributes: opts.include,
      shapeVector: opts.shape,
      layoutAware: opts.layoutAware
    });

    const structural = compareStructures(resultA.canonical, resultB.canonical);
    const shape = (resultA.shape && resultB.shape)
      ? compareShapeVectors(resultA.shape, resultB.shape)
      : undefined;

    const comparison = {
      hashA: resultA.hash,
      hashB: resultB.hash,
      similarity: structural,
      shapeSimilarity: shape,
      diff: opts.diff ? getStructuralDiff(resultA.canonical, resultB.canonical) : undefined
    };

    if (opts.layoutAware && resultA.layoutShape && resultB.layoutShape) {
      const layoutSim = compareLayoutVectors(resultA.layoutShape, resultB.layoutShape);
      console.log('Layout similarity (Jaccard):', (layoutSim * 100).toFixed(2) + '%');
    }

    if (opts.output) {
      console.log(formatResult(comparison, opts.output));
    } else {
      console.log('Structural similarity:', (structural * 100).toFixed(2) + '%');
      if (shape !== undefined) {
        console.log('Shape similarity (Jaccard):', (shape * 100).toFixed(2) + '%');
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