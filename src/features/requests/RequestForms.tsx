'use client';

import { useActionState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { submitPartRequest, submitTruckRequest, type RequestState } from './actions';
import { localisedName } from '@/lib/format';
import { AXLE_CONFIGURATIONS, CURRENCIES } from '@/types';
import type { LocationRow, TruckBrand } from '@/types';

const initial: RequestState = { ok: false };

function Sent({ title, body }: { title: string; body: string }) {
  return (
    <div className="card p-6 text-center">
      <p className="font-semibold text-[var(--color-ok)]">{title}</p>
      <p className="mt-1 text-sm text-[var(--color-muted)]">{body}</p>
    </div>
  );
}

export function TruckRequestForm({
  brands,
  locations,
  defaultPhone,
}: {
  brands: TruckBrand[];
  locations: LocationRow[];
  defaultPhone: string;
}) {
  const { t, locale } = useI18n();
  const [state, action, pending] = useActionState(submitTruckRequest, initial);

  if (state.ok) return <Sent title={t('request.sent')} body={t('request.sentBody')} />;

  return (
    <form action={action} className="card grid gap-4 p-5 sm:grid-cols-2">
      <div>
        <label className="label" htmlFor="r-brand">
          {t('truck.brand')}
        </label>
        <select id="r-brand" name="brandId" className="field">
          <option value="">—</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="r-model">
          {t('request.truckModel')}
        </label>
        <input id="r-model" name="modelText" className="field" maxLength={60} />
      </div>

      <div>
        <label className="label" htmlFor="r-year-from">
          {t('filters.yearFrom')}
        </label>
        <input id="r-year-from" name="yearFrom" type="number" inputMode="numeric" className="field" />
      </div>

      <div>
        <label className="label" htmlFor="r-year-to">
          {t('filters.yearTo')}
        </label>
        <input id="r-year-to" name="yearTo" type="number" inputMode="numeric" className="field" />
      </div>

      <div>
        <label className="label" htmlFor="r-price">
          {t('request.maxPrice')}
        </label>
        <input id="r-price" name="maxPrice" type="number" inputMode="numeric" min={0} className="field" />
      </div>

      <div>
        <label className="label" htmlFor="r-currency">
          {t('sell.currency')}
        </label>
        <select id="r-currency" name="currency" className="field" defaultValue="USD">
          {CURRENCIES.map((code) => (
            <option key={code} value={code}>
              {code}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="r-axle">
          {t('truck.axle')}
        </label>
        <select id="r-axle" name="axleConfiguration" className="field">
          <option value="">—</option>
          {AXLE_CONFIGURATIONS.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="r-location">
          {t('filters.location')}
        </label>
        <select id="r-location" name="locationId" className="field">
          <option value="">—</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {localisedName(location, locale)}
            </option>
          ))}
        </select>
      </div>

      <div className="sm:col-span-2">
        <label className="label" htmlFor="r-notes">
          {t('request.notes')}
        </label>
        <textarea id="r-notes" name="notes" rows={4} className="field" maxLength={1000} />
      </div>

      <div className="sm:col-span-2">
        <label className="label" htmlFor="r-phone">
          {t('request.contactPhone')}
        </label>
        <input
          id="r-phone"
          name="contactPhone"
          type="tel"
          inputMode="tel"
          required
          defaultValue={defaultPhone}
          className="field"
        />
      </div>

      {state.message && (
        <p role="alert" className="text-sm text-[var(--color-bad)] sm:col-span-2">
          {t(`errors.${state.message}`)}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary sm:col-span-2">
        {pending ? t('common.saving') : t('common.submit')}
      </button>
    </form>
  );
}

export function PartRequestForm({
  brands,
  locations,
  defaultPhone,
}: {
  brands: TruckBrand[];
  locations: LocationRow[];
  defaultPhone: string;
}) {
  const { t, locale } = useI18n();
  const [state, action, pending] = useActionState(submitPartRequest, initial);

  if (state.ok) return <Sent title={t('request.sent')} body={t('request.sentBody')} />;

  return (
    <form action={action} className="card grid gap-4 p-5 sm:grid-cols-2">
      <div>
        <label className="label" htmlFor="pr-brand">
          {t('truck.brand')}
        </label>
        <select id="pr-brand" name="brandId" className="field">
          <option value="">—</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="pr-model">
          {t('request.truckModel')}
        </label>
        <input id="pr-model" name="modelText" className="field" maxLength={60} />
      </div>

      <div>
        <label className="label" htmlFor="pr-year">
          {t('truck.year')}
        </label>
        <input id="pr-year" name="year" type="number" inputMode="numeric" className="field" />
      </div>

      <div>
        <label className="label" htmlFor="pr-number">
          {t('part.partNumber')}
        </label>
        <input id="pr-number" name="partNumber" className="field" maxLength={60} />
      </div>

      <div className="sm:col-span-2">
        <label className="label" htmlFor="pr-description">
          {t('request.partDescription')}
        </label>
        <textarea
          id="pr-description"
          name="description"
          rows={4}
          required
          minLength={5}
          maxLength={1000}
          className="field"
        />
      </div>

      <div>
        <label className="label" htmlFor="pr-location">
          {t('filters.location')}
        </label>
        <select id="pr-location" name="locationId" className="field">
          <option value="">—</option>
          {locations.map((location) => (
            <option key={location.id} value={location.id}>
              {localisedName(location, locale)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="pr-phone">
          {t('request.contactPhone')}
        </label>
        <input
          id="pr-phone"
          name="contactPhone"
          type="tel"
          inputMode="tel"
          required
          defaultValue={defaultPhone}
          className="field"
        />
      </div>

      {state.message && (
        <p role="alert" className="text-sm text-[var(--color-bad)] sm:col-span-2">
          {t(`errors.${state.message}`)}
        </p>
      )}

      <button type="submit" disabled={pending} className="btn btn-primary sm:col-span-2">
        {pending ? t('common.saving') : t('common.submit')}
      </button>
    </form>
  );
}
