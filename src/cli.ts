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

program.name('domhash').version(pkg.version);

// Define 'hash' subcommand
program
  .command('hash <input>')
  .description('Compute hash of a DOM input')
  .option('-i, --include-attrs <attrs>', 'Comma-separated list of attributes to include', parseAttrList)
  .option('-a, --algorithm <type>', 'Hashing algorithm: sha256, murmur3, blake3, simhash, minhash', 'sha256')
  .option('-s, --shape-vector', 'Output compressed shape vector (run-length encoded)', false)
  .option('-l, --layout-aware', 'Enable layout-aware hashing', false)
  .option('-r, --resilience', 'Output resilience score with detailed penalties', false)
  .option('--use-puppeteer', 'Connect to an existing Chrome via Puppeteer', false)
  .option('--browser-ws <wsEndpoint>', 'WebSocket endpoint to connect to Chrome')
  .option('--browser-url <browserURL>', 'HTTP endpoint to connect to Chrome')
  .action(async (...args) => {
    const command = args[args.length - 1];
    const opts = command.opts();
    const input = args[0];
    try {
      const source = await readFile(input);
      const domOptions: any = {
        algorithm: opts.algorithm,
        includeAttributes: opts.includeAttrs,
        shapeVector: opts.shapeVector,
        layoutAware: opts.layoutAware,
        resilience: opts.resilience,
        usePuppeteer: opts.usePuppeteer
      };
      if (opts.usePuppeteer && (opts.browserWs || opts.browserUrl)) {
        domOptions.puppeteerConnect = {
          browserWSEndpoint: opts.browserWs,
          browserURL: opts.browserUrl
        };
      }
      const result = await domhash(source, domOptions);

      console.log('Hash:', result.hash);
      if (opts.shapeVector && result.shape) {
        console.log('Shape:', JSON.stringify(result.shape));
      }
      if (opts.layoutAware && result.layoutShape) {
        console.log('Layout Shape:', JSON.stringify(result.layoutShape));
        console.log('Layout Hash:', result.layoutHash);
      }
      if (opts.resilience && result.resilienceScore !== undefined) {
        console.log(`Resilience: ${result.resilienceEmoji} ${result.resilienceLabel} (${(result.resilienceScore * 100).toFixed(2)}%)`);
        console.log('Breakdown:', {
          tagPenalty: (result.resilienceBreakdown?.tagPenalty * 100).toFixed(1) + '%',
          depthPenalty: (result.resilienceBreakdown?.depthPenalty * 100).toFixed(1) + '%',
          layoutPenalty: (result.resilienceBreakdown?.layoutPenalty * 100).toFixed(1) + '%'
        });
      }
    } catch (err: any) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

// Define 'compare' subcommand
program
  .command('compare <inputA> <inputB>')
  .description('Compare two DOM inputs')
  .option('-i, --include-attrs <attrs>', 'Comma-separated list of attributes to include', parseAttrList)
  .option('-a, --algorithm <type>', 'Hashing algorithm: sha256, murmur3, blake3, simhash, minhash', 'sha256')
  .option('-s, --shape-vector', 'Output compressed shape vector (run-length encoded)', false)
  .option('-l, --layout-aware', 'Enable layout-aware hashing', false)
  .option('--use-puppeteer', 'Connect to an existing Chrome via Puppeteer', false)
  .option('--browser-ws <wsEndpoint>', 'WebSocket endpoint to connect to Chrome')
  .option('--browser-url <browserURL>', 'HTTP endpoint to connect to Chrome')
  .option('-m, --shape-metric <type>', 'Shape similarity metric: jaccard (default), lcs, cosine, ted', 'jaccard')
  .option('-d, --diff', 'Show structural diff between inputs', false)
  .option('-o, --output <format>', 'Output format: json, markdown, html')
  .action(async (...args) => {
    const command = args[args.length - 1];
    const opts = command.opts();
    const inputA = args[0];
    const inputB = args[1];
    try {
      const sourceA = await readFile(inputA);
      const domOptions: any = {
        algorithm: opts.algorithm,
        includeAttributes: opts.includeAttrs,
        shapeVector: opts.shapeVector,
        layoutAware: opts.layoutAware,
        usePuppeteer: opts.usePuppeteer
      };
      if (opts.usePuppeteer && (opts.browserWs || opts.browserUrl)) {
        domOptions.puppeteerConnect = {
          browserWSEndpoint: opts.browserWs,
          browserURL: opts.browserUrl
        };
      }
      const resultA = await domhash(sourceA, domOptions);
      const sourceB = await readFile(inputB);
      const resultB = await domhash(sourceB, domOptions);

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
      }

      const comparison = {
        hashA: resultA.hash,
        hashB: resultB.hash,
        similarity: structural,
        shapeSimilarity,
        diff: opts.diff ? getStructuralDiff(resultA.canonical, resultB.canonical) : undefined
      };

      if (opts.layoutAware && resultA.layoutShape && resultB.layoutShape) {
        const layoutSim = compareLayoutVectors(resultA.layoutShape, resultB.layoutShape, opts.shapeMetric);
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
  });

// Define 'diff' subcommand
program
  .command('diff <inputA> <inputB>')
  .description('Show structural differences between two DOM inputs')
  .option('-i, --include-attrs <attrs>', 'Comma-separated list of attributes to include', parseAttrList)
  .action(async (...args: any[]) => {
    const command = args[args.length - 1];
    const [inputA, inputB] = args as [string, string, any];
    const opts = command.opts();
    try {
      const sourceA = await readFile(inputA);
      const resultA = await domhash(sourceA, { includeAttributes: opts.includeAttrs });
      const sourceB = await readFile(inputB);
      const resultB = await domhash(sourceB, { includeAttributes: opts.includeAttrs });
      const diff = getStructuralDiff(resultA.canonical, resultB.canonical);
      for (const line of diff) {
        console.log(line);
      }
    } catch (err: any) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

// Define 'shape' subcommand
program
  .command('shape <input>')
  .description('Output compressed shape vector of a DOM input')
  .option('-i, --include-attrs <attrs>', 'Comma-separated list of attributes to include', parseAttrList)
  .action(async (...args: any[]) => {
    const command = args[args.length - 1];
    const [input] = args as [string, any];
    const opts = command.opts();
    try {
      const source = await readFile(input);
      const result = await domhash(source, { includeAttributes: opts.includeAttrs, shapeVector: true });
      if (result.shape) {
        console.log(JSON.stringify(result.shape));
      } else {
        console.error('No shape vector available');
      }
    } catch (err: any) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

// Define 'layout' subcommand
program
  .command('layout <input>')
  .description('Output layout shape vector and hash of a DOM input')
  .option('-i, --include-attrs <attrs>', 'Comma-separated list of attributes to include', parseAttrList)
  .option('-a, --algorithm <type>', 'Hashing algorithm to use for layout hash', 'sha256')
  .action(async (...args: any[]) => {
    const command = args[args.length - 1];
    const [input] = args as [string, any];
    const opts = command.opts();
    try {
      const source = await readFile(input);
      const result = await domhash(source, {
        algorithm: opts.algorithm,
        includeAttributes: opts.includeAttrs,
        layoutAware: true
      });
      if (result.layoutShape) {
        console.log('Layout Shape:', JSON.stringify(result.layoutShape));
      }
      if (result.layoutHash) {
        console.log('Layout Hash:', result.layoutHash);
      }
    } catch (err: any) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

// Define 'resilience' subcommand
program
  .command('resilience <input>')
  .description('Output resilience score and breakdown of a DOM input')
  .option('-i, --include-attrs <attrs>', 'Comma-separated list of attributes to include', parseAttrList)
  .action(async (...args: any[]) => {
    const command = args[args.length - 1];
    const [input] = args as [string, any];
    const opts = command.opts();
    try {
      const source = await readFile(input);
      const result = await domhash(source, {
        includeAttributes: opts.includeAttrs,
        layoutAware: true,
        resilience: true
      });
      if (result.resilienceScore !== undefined) {
        console.log(`Resilience: ${result.resilienceEmoji} ${result.resilienceLabel} (${(result.resilienceScore * 100).toFixed(2)}%)`);
        console.log('Breakdown:', {
          tagPenalty: (result.resilienceBreakdown?.tagPenalty * 100).toFixed(1) + '%',
          depthPenalty: (result.resilienceBreakdown?.depthPenalty * 100).toFixed(1) + '%',
          layoutPenalty: (result.resilienceBreakdown?.layoutPenalty * 100).toFixed(1) + '%'
        });
      } else {
        console.error('No resilience data available');
      }
    } catch (err: any) {
      console.error('Error:', err.message);
      process.exit(1);
    }
  });

program.parseAsync();

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