import assert from 'node:assert/strict';
import { it } from 'node:test';
import { canSell } from '../src/lib/permissions.ts';

it('only enabled admins can post, including when a dealer is active', () => {
  assert.equal(canSell(null), false);
  for (const role of ['user', 'dealer', 'admin'] as const) {
    for (const status of ['active', 'warned', 'suspended', 'banned'] as const) {
      assert.equal(canSell({ role, status }), role === 'admin' && ['active', 'warned'].includes(status));
    }
  }
});
