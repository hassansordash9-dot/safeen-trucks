import type { ListingStatus } from '@/types';

/** Editing details must not put a sold vehicle back on sale. */
export function statusAfterSave(publish: boolean, current?: ListingStatus): ListingStatus {
  if (current === 'sold') return 'sold';
  if (!publish) return 'draft';
  return current === 'published' ? 'published' : 'pending';
}
