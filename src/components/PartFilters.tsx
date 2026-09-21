'use client';

import { useRouter } from 'next/navigation';
import { useI18n } from '@/i18n/I18nProvider';
import { localisedName } from '@/lib/format';
import { routes } from '@/lib/routes';
import type { LocationRow, PartCategory, TruckBrand } from '@/types';
import type { PartFilters as Filters } from '@/features/parts/filters';

export function PartFilters({
  filters,
  categories,
  brands,
  locations,
}: {
  filters: Filters;
  categories: PartCategory[];
  brands: TruckBrand[];
  locations: LocationRow[];
}) {
  const { t, locale } = useI18n();
  const router = useRouter();

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const params = new URLSearchParams();
    for (const [key, value] of data.entries()) {
      if (typeof value === 'string' && value.trim() !== '') params.set(key, value.trim());
    }
    const query = params.toString();
    router.push(`${routes.parts(locale)}${query ? `?${query}` : ''}`);
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="label" htmlFor="p-q">
          {t('filters.keyword')}
        </label>
        <input id="p-q" name="q" type="search" defaultValue={filters.q ?? ''} className="field" />
      </div>

      <div>
        <label className="label" htmlFor="p-category">
          {t('filters.category')}
        </label>
        <select id="p-category" name="category" className="field" defaultValue={filters.category ?? ''}>
          <option value="">{t('common.all')}</option>
          {categories.map((category) => (
            <option key={category.id} value={category.slug}>
              {localisedName(category, locale)}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="p-brand">
          {t('filters.compatibleBrand')}
        </label>
        <select
          id="p-brand"
          name="compatibleBrand"
          className="field"
          defaultValue={filters.compatibleBrand ?? ''}
        >
          <option value="">{t('common.all')}</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.slug}>
              {brand.name}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="label" htmlFor="p-model">
          {t('filters.model')}
        </label>
        <input
          id="p-model"
          name="compatibleModel"
          defaultValue={filters.compatibleModel ?? ''}
          className="field"
        />
      </div>

      <div>
        <label className="label" htmlFor="p-condition">
          {t('filters.condition')}
        </label>
        <select id="p-condition" name="condition" className="field" defaultValue={filters.condition ?? ''}>
          <option value="">{t('common.all')}</option>
          <option value="new">{t('condition.new')}</option>
          <option value="used">{t('condition.used')}</option>
          <option value="rebuilt">{t('condition.rebuilt')}</option>
        </select>
      </div>

      <div>
        <label className="label" htmlFor="p-type">
          {t('filters.partType')}
        </label>
        <select id="p-type" name="partType" className="field" defaultValue={filters.partType ?? ''}>
          <option value="">{t('common.all')}</option>
          <option value="original">{t('partType.original')}</option>
          <option value="aftermarket">{t('partType.aftermarket')}</option>
        </select>
      </div>

      <div>
        <label className="label" htmlFor="p-location">
          {t('filters.location')}
        </label>
        <select id="p-location" name="location" className="field" defaultValue={filters.location ?? ''}>
          <option value="">{t('common.all')}</option>
          {locations.map((location) => (
            <option key={location.id} value={location.slug}>
              {localisedName(location, locale)}
            </option>
          ))}
        </select>
      </div>

      <fieldset>
        <legend className="label">{t('sell.price')}</legend>
        <div className="grid grid-cols-2 gap-2">
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
        </div>
      </fieldset>

      <input type="hidden" name="sort" value={filters.sort} />

      <div className="flex gap-2 pt-1">
        <button type="submit" className="btn btn-primary flex-1">
          {t('common.apply')}
        </button>
        <button
          type="button"
          onClick={() => router.push(routes.parts(locale))}
          className="btn btn-outline"
        >
          {t('common.clear')}
        </button>
      </div>
    </form>
  );
}
