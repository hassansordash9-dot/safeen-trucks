import assert from 'node:assert/strict';
import { it } from 'node:test';
import { statusAfterSave } from '../src/lib/listing-status.ts';

it('editing or saving a sold listing never silently offers it for sale again', () => {
  assert.equal(statusAfterSave(true, 'sold'), 'sold');
  assert.equal(statusAfterSave(false, 'sold'), 'sold');
});

it('new listings still require review and published edits stay published', () => {
  assert.equal(statusAfterSave(true), 'pending');
  assert.equal(statusAfterSave(true, 'rejected'), 'pending');
  assert.equal(statusAfterSave(true, 'published'), 'published');
  assert.equal(statusAfterSave(false, 'published'), 'draft');
});
