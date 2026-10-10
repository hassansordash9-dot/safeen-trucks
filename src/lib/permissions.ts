import type { Profile } from '@/types';

/** Posting and editing require a database-backed, enabled admin profile. */
export function canSell(profile: Pick<Profile, 'role' | 'status'> | null): boolean {
  return profile?.role === 'admin' && ['active', 'warned'].includes(profile.status);
}
