'use client';

import { useActionState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/I18nProvider';
import { requestVerification, saveDealer, type DealerState } from './actions';
import { localisedName } from '@/lib/format';
import type { Dealer, LocationRow } from '@/types';

export function DealerForm({
  dealer,
  locations,
  verification,
}: {
  dealer: Dealer | null;
  locations: LocationRow[];
  verification: { status: 'pending' | 'approved' | 'rejected'; notes: string | null } | null;
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [state, action, pending] = useActionState<DealerState, FormData>(saveDealer, { ok: false });
  const [verifying, startVerify] = useTransition();

  return (
    <div className="space-y-5">
      <form action={action} className="card space-y-4 p-5">
        <div>
          <label className="label" htmlFor="business_name">
            {t('dealer.businessName')}
          </label>
          <input
            id="business_name"
            name="business_name"
            className="field"
            required
            defaultValue={dealer?.business_name ?? ''}
          />
        </div>

        <div>
          <label className="label" htmlFor="description">
            {t('dealer.description')}
          </label>
          <textarea
            id="description"
            name="description"
            rows={4}
            className="field"
            maxLength={2000}
            defaultValue={dealer?.description ?? ''}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
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
              defaultValue={dealer?.phone ?? ''}
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
              defaultValue={dealer?.whatsapp ?? ''}
            />
          </div>

          <div>
            <label className="label" htmlFor="website">
              {t('dealer.website')}
            </label>
            <input
              id="website"
              name="website"
              type="url"
              className="field"
              placeholder="https://"
              defaultValue={dealer?.website ?? ''}
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
              defaultValue={dealer?.location_id ?? ''}
            >
              <option value="">—</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {localisedName(location, locale)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {state.message && (
          <p role="alert" className="text-sm text-[var(--color-bad)]">
            {t(`errors.${state.message}`)}
          </p>
        )}
        {state.ok && (
          <p role="status" className="text-sm text-[var(--color-ok)]">
            {dealer ? t('common.save') : t('dealer.createdBody')}
          </p>
        )}

        <button type="submit" disabled={pending} className="btn btn-primary">
          {pending ? t('common.saving') : dealer ? t('common.save') : t('dealer.create')}
        </button>
      </form>

      {dealer && (
        <section className="card p-5">
          <h2 className="font-bold text-[var(--color-text)]">
            {t('dealer.requestVerification')}
          </h2>

          {dealer.verified ? (
            <p className="mt-2 text-sm text-[var(--color-ok)]">
              {t('dealer.verificationApproved')}
            </p>
          ) : verification?.status === 'pending' ? (
            <p className="mt-2 text-sm text-[var(--color-warn)]">
              {t('dealer.verificationPending')}
            </p>
          ) : (
            <>
              {verification?.status === 'rejected' && (
                <p className="mt-2 text-sm text-[var(--color-bad)]">
                  {t('dealer.verificationRejected')}
                  {verification.notes ? ` — ${verification.notes}` : ''}
                </p>
              )}
              <button
                type="button"
                disabled={verifying}
                onClick={() =>
                  startVerify(async () => {
                    await requestVerification(dealer.id);
                    router.refresh();
                  })
                }
                className="btn btn-outline mt-3"
              >
                {t('dealer.requestVerification')}
              </button>
            </>
          )}
        </section>
      )}
    </div>
  );
}
