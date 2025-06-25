# @iocium/domhash

Structure-aware and layout-aware perceptual hashing for HTML/DOM trees. Robust similarity detection, diffs, and resilience scoring with flexible CLI and API.

[![npm version](https://badge.fury.io/js/%40iocium%2Fdomhash.svg)](https://www.npmjs.com/package/@iocium/domhash) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![CI](https://github.com/iocium/domhash/actions/workflows/test.yml/badge.svg)](https://github.com/iocium/domhash/actions)

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [CLI Usage](#cli-usage)
- [API Reference](#api-reference)
- [Examples](#examples)
- [License](#license)

## Features

- Structural and visual similarity detection for DOM trees
- Layout-aware canonicalization with run-length encoding of layout shapes
- Run-length encoding (RLE) compression for shape vectors
- Hidden element support: prefixes and collapsing of consecutive hidden tags
- Flexible attribute handling: include/exclude data-*, aria-*, and custom attributes
- Resilience scoring to detect brittle or obfuscated DOMs with detailed penalties
- Support for perceptual hash algorithms: `sha256`, `murmur3`, `blake3`, `simhash`, `minhash`
- Detailed structural diffs in Markdown/HTML output
- Rich CLI and programmatic API
- 100% test coverage and CI integration

## Installation

```bash
npm install @iocium/domhash
```

## CLI Usage

```bash
npx domhash <input> [options]
```

| Option                  | Description                                                 |
|-------------------------|-------------------------------------------------------------|
| `-a, --algorithm <type>`      | Hash algorithm: `sha256`, `murmur3`, `blake3`, `simhash`, `minhash` (default: `sha256`) |
| `-i, --include-attrs <attrs>` | Comma-separated list of attributes to include               |
| `-s, --shape-vector`          | Output compressed shape vector (run-length encoded)         |
| `-m, --shape-metric <type>`   | Shape (and layout) similarity metric: `jaccard` (default), `lcs`, `cosine`, `ted` |
| `-l, --layout-aware`          | Enable layout-aware hashing and layout hash output          |
| `-r, --resilience`            | Output resilience score with detailed penalties            |
| `-c, --compare-with <input>`  | Compare against another HTML file or URL                   |
| `-d, --diff`                  | Show structural diff between inputs                         |
| `-o, --output <format>`       | Output format: `json`, `markdown`, `html`                   |

### Example

```bash
npx domhash index.html --layout-aware --shape-vector --resilience
```

```text
Hash: abc123...
Shape: ["div*4","span*2","p","span","div"]
Layout Shape: ["block*2","inline","block*1","inline*3"]
Layout Hash: def456...
Resilience: 🟢 Good (87.50%)
Breakdown: { tagPenalty: "2.0%", depthPenalty: "5.0%", layoutPenalty: "5.5%" }
```

## API Reference

```ts
import { domhash, compareStructures } from '@iocium/domhash';

const result = await domhash('<form><input></form>', {
  algorithm: 'blake3',
  layoutAware: true,
  resilience: true,
  shapeVector: true,
  includeAttributes: ['action']
});

console.log('Structure Hash:', result.hash);
console.log('Layout Hash:', result.layoutHash);
console.log('Shape Vector:', result.shape);        // run-length encoded
console.log('Layout Shape:', result.layoutShape);  // run-length encoded
console.log('Resilience Score:', result.resilienceScore);
console.log('Resilience:', result.resilienceEmoji, result.resilienceLabel);
```

The package also exports additional shape-comparison functions for programmatic use:
```ts
import { compareShapeJaccard, compareShapeLCS, compareShapeCosine, compareTreeEditDistance } from '@iocium/domhash';

// Using LCS-based shape similarity
const resA = await domhash(htmlA, { shapeVector: true });
const resB = await domhash(htmlB, { shapeVector: true });
const lcsScore = compareShapeLCS(resA.shape || [], resB.shape || []);
```

## Examples

// Compare two pages and generate a Markdown report:

```bash
npx domhash page1.html --compare-with page2.html --diff --output markdown > report.md
```

## License

MIT License — see [LICENSE](LICENSE) for details.

---

Made with 💙 by [iocium](https://github.com/iocium)