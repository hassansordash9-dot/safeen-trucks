'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useI18n } from '@/i18n/I18nProvider';
import { localisedName } from '@/lib/format';
import { routes } from '@/lib/routes';
import { AXLE_CONFIGURATIONS, EMISSION_CLASSES, TRANSMISSIONS } from '@/types';
import type { LocationRow, TruckBrand, TruckModel, TruckType } from '@/types';
import type { TruckFilters as Filters } from '@/features/trucks/filters';

type Props = {
  filters: Filters;
  brands: TruckBrand[];
  models: TruckModel[];
  types: TruckType[];
  locations: LocationRow[];
};

export function TruckFilters({ filters, brands, models, types, locations }: Props) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [brand, setBrand] = useState(filters.brand ?? '');
  const [showAdvanced, setShowAdvanced] = useState(
    Boolean(
      filters.hpFrom ||
        filters.transmission ||
        filters.axle ||
        filters.emission ||
        filters.seller ||
        filters.verified,
    ),
  );

  const brandId = useMemo(() => brands.find((b) => b.slug === brand)?.id, [brands, brand]);
  const brandModels = useMemo(
    () => (brandId ? models.filter((m) => m.brand_id === brandId) : []),
    [models, brandId],
  );

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const [key, value] of data.entries()) {
      if (typeof value === 'string' && value.trim() !== '') params.set(key, value.trim());
    }
    const query = params.toString();
    router.push(`${routes.trucks(locale)}${query ? `?${query}` : ''}`);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <Field label={t('common.search')} htmlFor="f-q">
        <input id="f-q" name="q" defaultValue={filters.q ?? ''} className="field" type="search" />
      </Field>

      <Field label={t('filters.brand')} htmlFor="f-brand">
        <select
          id="f-brand"
          name="brand"
          className="field"
          value={brand}
          onChange={(e) => setBrand(e.target.value)}
        >
          <option value="">{t('common.all')}</option>
          {brands.map((b) => (
            <option key={b.id} value={b.slug}>
              {b.name}
            </option>
          ))}
        </select>
      </Field>

      {brandModels.length > 0 && (
        <Field label={t('filters.model')} htmlFor="f-model">
          <select id="f-model" name="model" className="field" defaultValue={filters.model ?? ''}>
            <option value="">{t('common.all')}</option>
            {brandModels.map((m) => (
              <option key={m.id} value={m.slug}>
                {m.name}
              </option>
            ))}
          </select>
        </Field>
      )}

      <Field label={t('filters.truckType')} htmlFor="f-type">
        <select id="f-type" name="type" className="field" defaultValue={filters.type ?? ''}>
          <option value="">{t('common.all')}</option>
          {types.map((type) => (
            <option key={type.id} value={type.slug}>
              {localisedName(type, locale)}
            </option>
          ))}
        </select>
      </Field>

      <Field label={t('filters.location')} htmlFor="f-location">
        <select
          id="f-location"
          name="location"
          className="field"
          defaultValue={filters.location ?? ''}
        >
          <option value="">{t('common.all')}</option>
          {locations.map((l) => (
            <option key={l.id} value={l.slug}>
              {localisedName(l, locale)}
            </option>
          ))}
        </select>
      </Field>

      <Pair
        label={t('truck.year')}
        a={
          <input
            name="yearFrom"
            type="number"
            inputMode="numeric"
            min={1950}
            max={2100}
            placeholder={t('common.from')}
            defaultValue={filters.yearFrom ?? ''}
            className="field"
            aria-label={t('filters.yearFrom')}
          />
        }
        b={
          <input
            name="yearTo"
            type="number"
            inputMode="numeric"
            min={1950}
            max={2100}
            placeholder={t('common.to')}
            defaultValue={filters.yearTo ?? ''}
            className="field"
            aria-label={t('filters.yearTo')}
          />
        }
      />

      <Pair
        label={t('sell.price')}
        a={
          <input
            name="priceFrom"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={t('common.min')}
            defaultValue={filters.priceFrom ?? ''}
            className="field"
            aria-label={t('filters.priceFrom')}
          />
        }
        b={
          <input
            name="priceTo"
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={t('common.max')}
            defaultValue={filters.priceTo ?? ''}
            className="field"
            aria-label={t('filters.priceTo')}
          />
        }
      />

      <Field label={t('filters.mileageMax')} htmlFor="f-mileage">
        <input
          id="f-mileage"
          name="mileageTo"
          type="number"
          inputMode="numeric"
          min={0}
          defaultValue={filters.mileageTo ?? ''}
          className="field"
        />
      </Field>

      <Field label={t('filters.condition')} htmlFor="f-condition">
        <select
          id="f-condition"
          name="condition"
          className="field"
          defaultValue={filters.condition ?? ''}
        >
          <option value="">{t('common.all')}</option>
          <option value="new">{t('condition.new')}</option>
          <option value="used">{t('condition.used')}</option>
        </select>
      </Field>

      {!showAdvanced && (
        <button type="button" onClick={() => setShowAdvanced(true)} className="btn btn-ghost w-full">
          {t('filters.advanced')}
        </button>
      )}

      {showAdvanced && (
        <div className="space-y-4 border-t border-[var(--color-line)] pt-4">
          <Field label={t('filters.horsepowerMin')} htmlFor="f-hp">
            <input
              id="f-hp"
              name="hpFrom"
              type="number"
              inputMode="numeric"
              min={0}
              defaultValue={filters.hpFrom ?? ''}
              className="field"
            />
          </Field>

          <Field label={t('filters.transmission')} htmlFor="f-trans">
            <select
              id="f-trans"
              name="transmission"
              className="field"
              defaultValue={filters.transmission ?? ''}
            >
              <option value="">{t('common.all')}</option>
              {TRANSMISSIONS.map((value) => (
                <option key={value} value={value}>
                  {t(`transmission.${value}`)}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t('filters.axle')} htmlFor="f-axle">
            <select id="f-axle" name="axle" className="field" defaultValue={filters.axle ?? ''}>
              <option value="">{t('common.all')}</option>
              {AXLE_CONFIGURATIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t('filters.emission')} htmlFor="f-emission">
            <select
              id="f-emission"
              name="emission"
              className="field"
              defaultValue={filters.emission ?? ''}
            >
              <option value="">{t('common.all')}</option>
              {EMISSION_CLASSES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t('filters.sellerType')} htmlFor="f-seller">
            <select id="f-seller" name="seller" className="field" defaultValue={filters.seller ?? ''}>
              <option value="">{t('common.all')}</option>
              <option value="dealer">{t('filters.dealersOnly')}</option>
              <option value="private">{t('filters.privateOnly')}</option>
            </select>
          </Field>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              name="verified"
              value="1"
              defaultChecked={Boolean(filters.verified)}
              className="h-4 w-4"
            />
            {t('filters.verifiedOnly')}
          </label>
        </div>
      )}

      <input type="hidden" name="sort" value={filters.sort} />

      <div className="flex gap-2 pt-1">
        <button type="submit" className="btn btn-primary flex-1">
          {t('common.apply')}
        </button>
        <button
          type="button"
          onClick={() => router.push(routes.trucks(locale))}
          className="btn btn-outline"
        >
          {t('common.clear')}
        </button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>
        {label}
      </label>
      {children}
    </div>
  );
}

function Pair({ label, a, b }: { label: string; a: React.ReactNode; b: React.ReactNode }) {
  return (
    <fieldset>
      <legend className="label">{label}</legend>
      <div className="grid grid-cols-2 gap-2">
        {a}
        {b}
      </div>
    </fieldset>
  );
}
