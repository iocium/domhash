# @iocium/domhash

Structure-aware and layout-aware perceptual hashing for HTML/DOM trees. Robust similarity detection, diffs, and resilience scoring with flexible CLI and API.

[![npm version](https://badge.fury.io/js/%40iocium%2Fdomhash.svg)](https://www.npmjs.com/package/@iocium/domhash) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![CI](https://github.com/iocium/domhash/actions/workflows/test.yml/badge.svg)](https://github.com/iocium/domhash/actions)

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [CLI Usage](#cli-usage)
- [Demo](https://iocium.github.io/domhash)
- [API Docs](https://iocium.github.io/domhash/api)
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

Usage:
```bash
npx domhash <command> [options]
```

Commands:

  hash <input> [options]                Compute hash of a DOM input
  compare <inputA> <inputB> [options]   Compare two DOM inputs (structural & shape)
  diff <inputA> <inputB> [options]      Show structural differences between two inputs
  shape <input> [options]               Output compressed shape vector of a DOM input
  layout <input> [options]              Output layout shape vector and layout hash
  resilience <input> [options]          Output resilience score and breakdown

For detailed help on a specific command:

```bash
npx domhash <command> --help
```


## Examples

// Compare two pages and generate a Markdown report:

```bash
npx domhash compare page1.html page2.html --diff --output markdown > report.md
```

## License

MIT License — see [LICENSE](LICENSE) for details.

---

Made with 💙 by [iocium](https://github.com/iocium)