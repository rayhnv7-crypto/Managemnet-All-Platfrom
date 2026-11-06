import test from 'node:test';
import assert from 'node:assert/strict';
import { safeEqual } from '../api/_lib/http.js';

test('safeEqual accepts equal secrets', () => {
  assert.equal(safeEqual('secret-value', 'secret-value'), true);
});

test('safeEqual rejects mismatched, empty, and different-length secrets', () => {
  assert.equal(safeEqual('secret-value', 'other-value'), false);
  assert.equal(safeEqual('', ''), false);
  assert.equal(safeEqual('short', 'longer'), false);
  assert.equal(safeEqual(undefined, 'secret-value'), false);
});
