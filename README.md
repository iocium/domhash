# @iocium/domhash

Structure-aware and layout-aware perceptual hashing for HTML and DOM content.

[![npm version](https://badge.fury.io/js/%40iocium%2Fdomhash.svg)](https://www.npmjs.com/package/@iocium/domhash)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![CI](https://github.com/iocium/domhash/actions/workflows/test.yml/badge.svg)](https://github.com/iocium/domhash/actions)

---

## Features

- Structural and visual similarity detection for DOM trees
- Layout-aware hashing using tag display roles (block, inline, etc.)
- Supports perceptual hash algorithms: `sha256`, `murmur3`, `blake3`, `simhash`, `minhash`
- Resilience scoring to detect obfuscated or fragile DOMs
- Rich CLI and programmatic API
- Markdown and HTML output with structural diffs
- 100% test coverage

---

## Installation

```bash
npm install @iocium/domhash
```

---

## CLI Usage

```bash
npx domhash <input> [options]
```

### Flags

| Option            | Description                                        |
|-------------------|----------------------------------------------------|
| `--algo <type>`   | Choose hashing algorithm                          |
| `--include <attrs>` | Comma-separated list of attributes to include    |
| `--shape`         | Output tag shape vector                           |
| `--layoutAware`   | Enable layout-based canonicalization              |
| `--resilience`    | Output a resilience score                         |
| `--compare <input>` | Compare against another HTML or URL              |
| `--diff`          | Show structural diff                              |
| `--output <type>` | Output format: `json`, `markdown`, `html`         |

---

## Programmatic API

```ts
import { domhash, computeResilienceScore, compareStructures } from '@iocium/domhash';

const result = await domhash('<form><input></form>', {
  layoutAware: true,
  resilience: true,
  shapeVector: true,
  includeAttributes: ['action']
});

console.log(result.hash);              // structure hash
console.log(result.layoutHash);        // layout-aware hash
console.log(result.resilienceScore);   // between 0 and 1
console.log(result.shape);             // tag structure vector
```

---

## Output Example (Markdown)

```markdown
### DOM Hash Comparison Report

- SHA A: `abc123`
- SHA B: `def456`
- Structural Similarity: `91.25%`
- Shape Similarity: `88.00%`

**Structural Diff:**

```diff
- <p></p>
+ <span></span>
```

---

## © License

MIT.

Built by [iocium](https://github.com/iocium) with care.
