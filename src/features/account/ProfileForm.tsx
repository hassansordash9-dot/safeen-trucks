'use client';

import { useActionState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { updateProfile, type ActionState } from './actions';
import { localisedName } from '@/lib/format';
import type { LocationRow, Profile } from '@/types';

export function ProfileForm({
  profile,
  locations,
}: {
  profile: Profile | null;
  locations: LocationRow[];
}) {
  const { t, locale } = useI18n();
  const [state, action, pending] = useActionState<ActionState, FormData>(updateProfile, {
    ok: false,
  });

  return (
    <form action={action} className="card space-y-4 p-5">
      <div>
        <label className="label" htmlFor="full_name">
          {t('auth.fullName')}
        </label>
        <input
          id="full_name"
          name="full_name"
          className="field"
          required
          defaultValue={profile?.full_name ?? ''}
        />
      </div>

      <div>
        <label className="label" htmlFor="phone">
          {t('auth.phone')}
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="tel"
          className="field"
          defaultValue={profile?.phone ?? ''}
        />
      </div>

      <div>
        <label className="label" htmlFor="whatsapp">
          {t('sell.whatsappNumber')}
        </label>
        <input
          id="whatsapp"
          name="whatsapp"
          type="tel"
          inputMode="tel"
          className="field"
          defaultValue={profile?.whatsapp ?? ''}
        />
      </div>

      <div>
        <label className="label" htmlFor="location_id">
          {t('filters.location')}
        </label>
        <select
          id="location_id"
          name="location_id"
          className="field"
          defaultValue={profile?.location_id ?? ''}
        >
          <option value="">—</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {localisedName(location, locale)}
            </option>
          ))}
        </select>
      </div>

      {state.message && (
        <p role="alert" className="text-sm text-[var(--color-bad)]">
          {t(`errors.${state.message}`)}
        </p>
      )}
      {state.ok && (
        <p role="status" className="text-sm text-[var(--color-ok)]">
          {t('common.save')}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary">
        {pending ? t('common.saving') : t('common.save')}
      </button>
    </form>
  );
}
