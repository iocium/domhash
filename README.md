# @iocium/domhash 🌀

Structure- and layout-aware perceptual hashing for HTML/DOM trees.
Quickly fingerprint, compare, diff, and score DOMs for robustness and similarity.

[![npm](https://img.shields.io/npm/v/@iocium/domhash)](https://www.npmjs.com/package/@iocium/domhash)
[![build](https://github.com/iocium/domhash/actions/workflows/test.yml/badge.svg)](https://github.com/iocium/domhash/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/iocium/domhash/branch/main/graph/badge.svg)](https://codecov.io/gh/iocium/domhash)
[![npm downloads](https://img.shields.io/npm/dm/@iocium/domhash)](https://www.npmjs.com/package/@iocium/domhash)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@iocium/domhash)](https://bundlephobia.com/package/@iocium/domhash)
[![types](https://img.shields.io/npm/types/@iocium/domhash)](https://www.npmjs.com/package/@iocium/domhash)
[![license](https://img.shields.io/npm/l/@iocium/domhash)](https://github.com/iocium/domhash/blob/main/LICENSE)

## 🚀 Quick Start

```bash
npm install @iocium/domhash
```

### Programmatic API

```ts
import { domhash, computeResilienceScore, getStructuralDiff } from '@iocium/domhash';

(async () => {
  const result = await domhash('<div><span>Hello</span></div>', {
    shapeVector: true,
    layoutAware: true,
    resilience: true,
    algorithm: 'sha256',
  });
  console.log(result);
})();
```

### CLI Usage

```bash
npx domhash hash index.html                # Compute a DOM hash
npx domhash compare a.html b.html          # Structural & shape compare
npx domhash diff a.html b.html --output markdown  # Markdown diff report
npx domhash layout index.html              # Layout shape vector + hash
npx domhash resilience index.html          # Resilience score & breakdown
```

## ✨ Features

- ⚙️ **Multi-algo hashing**: `sha256`, `murmur3`, `blake3`, `simhash`, `minhash`
- 📐 **Structure vectors**: run-length–encoded tag sequences for compact fingerprints
- 🖼 **Layout vectors**: capture `display`, `position`, `visibility`, `opacity`, hide flags, with RLE compression
- 💪 **Resilience scoring**: combined structural + layout penalties to gauge fragility vs robustness
- 🔄 **Compare & diff**: Jaccard, LCS, cosine, TED metrics + Markdown/HTML diff outputs
- 🔧 **Custom attributes**: include or exclude `data-*`, `aria-*`, or specific attributes
- 🛠 **Flexible API**: CLI, ESM, CJS; works in Node, browser, and Cloudflare Workers
- 🎨 **Formatters**: JSON, Markdown, HTML
- ✅ **Fully tested**: 100% coverage + integration smoke tests

## 🔍 Examples

### Structural Hash

```ts
import { domhash } from '@iocium/domhash';
const res = await domhash('<ul><li>A</li><li>B</li></ul>', { shapeVector: true });
console.log(res.shape); // ['ul', 'li*2']
```

### Layout-Aware Hash

```ts
import { domhash } from '@iocium/domhash';
const res = await domhash('<div><p>Test</p></div>', { layoutAware: true });
console.log(res.layoutShape); // ['div:block', 'p:block']
```

### Resilience Score

```ts
import { domhash } from '@iocium/domhash';
const res = await domhash('<div><span>Hi</span></div>', { resilience: true });
console.log(res.resilienceScore, res.resilienceLabel); // 1.0 'Strong'
```

### Structural Diff

```ts
import { getStructuralDiff } from '@iocium/domhash';
const diff = getStructuralDiff('<div><p>A</p></div>', '<div><span>B</span></div>');
console.log(diff.join('\n'));
```

## ❓ FAQ

**Q: What is the difference between structural vs layout vs resilience scores?**
- **Structural**: tag variety, depth, repetition, leaf density.
- **Layout**: element display/position/visibility/opacity flags describing visual flow.
- **Resilience**: combined structural + layout penalties to detect brittle or obfuscated DOMs.

**Q: Can I use this in Cloudflare Workers?**  
Yes! The browser bundle uses Web Crypto, `DOMParser`, `TextEncoder`, and `fetch`, fully compatible with Workers.

**Q: How do I include custom attributes?**  
Use `includeAttributes: ['data-id', 'role']` or set `includeDataAndAriaAttributes: true` in options.

**Q: Why use murmur3?**  
Murmur3 is ultra-fast (32-bit) for quick comparisons; use SHA-256 or Blake3 for stronger guarantees.

## 📄 License

MIT © [iocium](https://github.com/iocium)