// jest.setup.js
// Polyfill TextEncoder/TextDecoder for Jest environment and dynamic imports
const util = require('util');
if (util.TextEncoder) {
  global.TextEncoder = util.TextEncoder;
}
if (util.TextDecoder) {
  global.TextDecoder = util.TextDecoder;
}
// Also ensure on globalThis for ESM loader contexts
if (util.TextEncoder) {
  globalThis.TextEncoder = util.TextEncoder;
}
if (util.TextDecoder) {
  globalThis.TextDecoder = util.TextDecoder;
}