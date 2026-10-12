import assert from 'node:assert/strict';
import { it } from 'node:test';
import { imageUrl } from '../src/lib/images.ts';

it('stored photos use the session-aware endpoint rather than public bucket URLs', () => {
  assert.equal(imageUrl('user/truck/a.jpg'), '/api/listing-image?path=user%2Ftruck%2Fa.jpg');
  assert.equal(imageUrl(null), null);
  assert.equal(imageUrl('https://example.com/public.jpg'), 'https://example.com/public.jpg');
});
