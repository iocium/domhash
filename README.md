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
- 🔄 **Compare & diff**: Jaccard (plain and length-guarded), LCS, cosine, TED metrics + Markdown/HTML diff outputs
- 🔧 **Custom attributes**: include or exclude `data-*`, `aria-*`, or specific attributes
- 🔗 **Attribute values**: optionally hash normalized `href`/`src`/`action` values so link destinations affect the fingerprint
- 🧹 **Perceptual text mode**: NFKC + zero-width removal + whitespace collapse for comparing visually equivalent pages
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

## 🔐 Security considerations

This library is a *perceptual* fingerprinting tool, not a content-integrity system. Read this before using hashes in a security context.

**Hash algorithms.** `sha256` (default) and `blake3` are cryptographic. `murmur3`, `simhash`, and `minhash` are fast 32-bit *non-cryptographic* hashes: an attacker can find colliding input with ~2³² attempts, so do not rely on them to authenticate or compare security-sensitive content.

**Attribute values are not hashed by default.** The canonical string contains attribute *names* only. That means an attacker can rewrite every `href`, `src`, or `action` on a page (phishing redirects, malicious script sources) without changing the hash. If link/script destinations must affect the fingerprint:

```ts
const res = await domhash(html, { includeAttributeValues: ['href', 'src', 'action'] });
```

Values are normalized before hashing (URL scheme/host lowercased, fragments dropped, whitespace collapsed), so cosmetic differences don't flip the hash while real destination changes do.

**Invisible characters.** Text nodes are hashed as-is by default, so zero-width characters and Unicode ligatures *do* flip a strict hash (good for tamper detection) but make visually identical pages score poorly on similarity metrics. For perceptual comparison, enable:

```ts
const res = await domhash(html, { normalizeText: true });
```

**Hidden content.** The layout vector's `isHidden` flag covers `display:none`, `visibility:hidden|collapse`, `opacity:0`, zero `width`/`height`, `font-size:0`, `clip:rect(0,0,0,0)`, `clip-path:inset(50%)`, `transform:scale(0)`, `content-visibility:hidden`, off-screen positioning, and (in real browsers) zero-area bounding boxes.

**Similarity metrics are dilutable.** Plain Jaccard on run-length-encoded shape vectors stays high when both pages share a long run, even if one side has injected content. For tamper detection prefer `jaccard-guarded` (bounded by the length ratio), `lcs`, or `ted`:

```bash
npx domhash compare a.html b.html -s -m jaccard-guarded
```

**Rendering executes JavaScript.** `usePuppeteer` renders untrusted HTML in a real browser, so the page's scripts run and can mutate the DOM before hashing (including mutating it back to a known-good value). Prefer the default fetch-and-parse path when hashing untrusted input.

**All input modes hash identically.** Every path that parses HTML — the string path, the Node.js URL-fetch fallback, and browser `Document` input — uses the WHATWG HTML5 tree construction algorithm (parse5, the same algorithm browsers and jsdom implement), so the same source document hashes identically no matter how you feed it in, including implicit elements (`<head>`, `<tbody>`). Bare snippets are parsed as full documents (wrapped in `html/head/body`), matching what a browser `DOMParser` does. Note: in plain Node the fallback returns a minimal element adapter (see `src/core/parse5Element.ts`) — enough for hashing, with a simple `querySelector` (`tag`, `#id`, `.class`).

## ❓ FAQ

**Q: What is the difference between structural vs layout vs resilience scores?**
- **Structural**: tag variety, depth, repetition, leaf density.
- **Layout**: element display/position/visibility/opacity flags describing visual flow.
- **Resilience**: combined structural + layout penalties to detect brittle or obfuscated DOMs.

**Q: Can I use this in Cloudflare Workers?**  
Yes! The browser bundle uses Web Crypto, `DOMParser`, `TextEncoder`, and `fetch`, fully compatible with Workers.

**Q: How do I include custom attributes?**  
Use `includeAttributes: ['data-id', 'role']` or set `includeDataAndAriaAttributes: true` in options. By default only attribute *names* are hashed — use `includeAttributeValues: ['href', 'src']` when attribute *values* must affect the hash.

**Q: Why use murmur3?**  
Murmur3 is ultra-fast (32-bit) for quick comparisons; use SHA-256 or Blake3 for stronger guarantees. The 32-bit algorithms are non-cryptographic — see [Security considerations](#-security-considerations).

## 📄 License

MIT © [iocium](https://github.com/iocium)