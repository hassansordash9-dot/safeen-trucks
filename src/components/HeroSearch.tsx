'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { IconSearch } from './icons';
import { useI18n } from '@/i18n/I18nProvider';
import { localisedName } from '@/lib/format';
import { routes } from '@/lib/routes';
import type { LocationRow, TruckBrand, TruckModel } from '@/types';

export function HeroSearch({
  brands,
  models,
  locations,
}: {
  brands: TruckBrand[];
  models: TruckModel[];
  locations: LocationRow[];
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [priceTo, setPriceTo] = useState('');
  const [location, setLocation] = useState('');

  const brandId = useMemo(() => brands.find((b) => b.slug === brand)?.id, [brands, brand]);
  const brandModels = useMemo(
    () => (brandId ? models.filter((m) => m.brand_id === brandId) : []),
    [models, brandId],
  );

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const params = new URLSearchParams();
    if (brand) params.set('brand', brand);
    if (model) params.set('model', model);
    if (priceTo) params.set('priceTo', priceTo);
    if (location) params.set('location', location);
    const query = params.toString();
    router.push(`${routes.trucks(locale)}${query ? `?${query}` : ''}`);
  }

  return (
    <form onSubmit={submit} className="card grid gap-3 p-3 sm:grid-cols-2 lg:grid-cols-5 lg:p-4">
      <div>
        <label className="label sr-only" htmlFor="hero-brand">
          {t('filters.brand')}
        </label>
        <select
          id="hero-brand"
          className="field"
          value={brand}
          onChange={(e) => {
            setBrand(e.target.value);
            setModel('');
          }}
        >
          <option value="">{t('filters.brand')}</option>
          {brands.map((b) => (
            <option key={b.id} value={b.slug}>
              {b.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label sr-only" htmlFor="hero-model">
          {t('filters.model')}
        </label>
        <select
          id="hero-model"
          className="field"
          value={model}
          onChange={(e) => setModel(e.target.value)}
          disabled={!brandModels.length}
        >
          <option value="">{t('filters.model')}</option>
          {brandModels.map((m) => (
            <option key={m.id} value={m.slug}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label sr-only" htmlFor="hero-price">
          {t('filters.priceTo')}
        </label>
        <input
          id="hero-price"
          className="field"
          type="number"
          inputMode="numeric"
          min={0}
          placeholder={t('filters.priceTo')}
          value={priceTo}
          onChange={(e) => setPriceTo(e.target.value)}
        />
      </div>

      <div>
        <label className="label sr-only" htmlFor="hero-location">
          {t('filters.location')}
        </label>
        <select
          id="hero-location"
          className="field"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
        >
          <option value="">{t('filters.location')}</option>
          {locations.map((l) => (
            <option key={l.id} value={l.slug}>
              {localisedName(l, locale)}
            </option>
          ))}
        </select>
      </div>

      <button type="submit" className="btn btn-accent w-full">
        <IconSearch className="h-4 w-4" />
        {t('home.searchTrucks')}
      </button>
    </form>
  );
}
