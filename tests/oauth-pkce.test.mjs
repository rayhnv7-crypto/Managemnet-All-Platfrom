import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';

test('OAuth PKCE S256 challenge is deterministic and verifier is not exposed',()=>{
 const verifier=crypto.randomBytes(32).toString('base64url');
 const challenge=crypto.createHash('sha256').update(verifier).digest('base64url');
 assert.match(verifier,/^[A-Za-z0-9_-]{43}$/);
 assert.match(challenge,/^[A-Za-z0-9_-]{43}$/);
 assert.notEqual(challenge,verifier);
 assert.equal(crypto.createHash('sha256').update(verifier).digest('base64url'),challenge);
});
