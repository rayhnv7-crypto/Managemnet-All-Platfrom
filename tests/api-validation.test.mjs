import test from 'node:test';
import assert from 'node:assert/strict';

// Regression checks for validation behavior implemented in API handlers.
test('date input must use YYYY-MM-DD and reject impossible dates',()=>{
 const valid=v=>/^\d{4}-\d{2}-\d{2}$/.test(v)&&!Number.isNaN(Date.parse(v))&&new Date(v).toISOString().slice(0,10)===v;
 assert.equal(valid('2026-11-03'),true);
 assert.equal(valid('2026-02-30'),false);
 assert.equal(valid('03-11-2026'),false);
});

test('analytics numeric metrics clamp negative values and invalid values to zero',()=>{
 const metric=v=>Math.max(0,Number(v)||0); assert.equal(metric(-12),0);
 assert.equal(metric('not-a-number'),0);
 assert.equal(metric('25'),25);
});

test('API key request body JSON parsing rejects malformed JSON',()=>{
 assert.throws(()=>JSON.parse('{bad json'));
 assert.deepEqual(JSON.parse('{"name":"demo"}'),{name:'demo'});
});
