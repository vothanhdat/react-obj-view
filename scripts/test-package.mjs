import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const commonjs = require('react-obj-view');
const esm = await import('react-obj-view');

for (const library of [commonjs, esm]) {
    assert.equal(typeof library.ObjectView, 'function');
    assert.equal(typeof library.objectTreeWalking, 'function');
    const walker = library.objectTreeWalking();
    const result = walker.walking({ answer: 42 }, 'root', {
        nonEnumerable: false, symbol: false,
    }, 1);
    assert.equal(result.childCount, 2);
    assert.equal(walker.getNode(1).state.value, 42);
}
assert.deepEqual(Object.keys(commonjs).sort(), Object.keys(esm).sort());
console.log('CommonJS and ESM package imports passed.');
