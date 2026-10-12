import assert from 'node:assert/strict';
import { it } from 'node:test';
import { statusAfterSave } from '../src/lib/listing-status.ts';

it('editing or saving a sold listing never silently offers it for sale again', () => {
  assert.equal(statusAfterSave(true, 'sold'), 'sold');
  assert.equal(statusAfterSave(false, 'sold'), 'sold');
});

it('admins publish directly and drafts stay private', () => {
  assert.equal(statusAfterSave(true), 'published');
  assert.equal(statusAfterSave(true, 'rejected'), 'published');
  assert.equal(statusAfterSave(true, 'published'), 'published');
  assert.equal(statusAfterSave(false, 'published'), 'draft');
});
