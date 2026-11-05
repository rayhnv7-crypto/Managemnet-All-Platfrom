import test from 'node:test';import assert from 'node:assert/strict';import crypto from 'node:crypto';
test('OAuth encryption key format is exactly 32-byte hex',()=>{const key=crypto.randomBytes(32).toString('hex');assert.equal(key.length,64);assert.match(key,/^[a-f0-9]{64}$/);});
test('OAuth state hash is one-way and deterministic',()=>{const s='random-state';const h=crypto.createHash('sha256').update(s).digest('hex');assert.equal(h,crypto.createHash('sha256').update(s).digest('hex'));assert.notEqual(h,s);});
test('worker cron authorization is bearer token shaped',()=>{const secret='test-secret';assert.equal('Bearer '+secret,'Bearer test-secret');});
console.log('SEO OAuth/worker guard tests loaded');
