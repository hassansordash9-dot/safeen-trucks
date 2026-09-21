'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { ImageUploader, type UploadedImage } from '@/components/ImageUploader';
import { QualityMeter, WizardShell } from '@/components/WizardShell';
import { useI18n } from '@/i18n/I18nProvider';
import { formatPrice, localisedName } from '@/lib/format';
import { scorePart } from '@/lib/quality';
import { routes } from '@/lib/routes';
import { savePart } from './actions';
import { CURRENCIES } from '@/types';
import type { LocationRow, Part, PartCategory, TruckBrand } from '@/types';

type Form = {
  categoryId: string;
  title: string;
  brand: string;
  partNumber: string;
  oemNumber: string;
  condition: 'new' | 'used' | 'rebuilt';
  partType: '' | 'original' | 'aftermarket';
  compatibleBrandId: string;
  compatibleModels: string;
  price: string;
  currency: 'USD' | 'IQD';
  negotiable: boolean;
  description: string;
  locationId: string;
  phone: string;
  whatsapp: string;
};

function initialForm(part: Part | null, defaults: { phone: string; whatsapp: string }): Form {
  return {
    categoryId: part?.category_id ?? '',
    title: part?.title ?? '',
    brand: part?.brand ?? '',
    partNumber: part?.part_number ?? '',
    oemNumber: part?.oem_number ?? '',
    condition: part?.condition ?? 'used',
    partType: part?.part_type ?? '',
    compatibleBrandId: part?.compatible_brand_id ?? '',
    compatibleModels: part?.compatible_models?.join(', ') ?? '',
    price: part ? String(part.price) : '',
    currency: part?.currency ?? 'USD',
    negotiable: part?.negotiable ?? false,
    description: part?.description ?? '',
    locationId: part?.location_id ?? '',
    phone: part?.phone ?? defaults.phone,
    whatsapp: part?.whatsapp ?? defaults.whatsapp,
  };
}

export function PartWizard({
  userId,
  part,
  dealerId,
  defaults,
  categories,
  brands,
  locations,
}: {
  userId: string;
  part: Part | null;
  dealerId: string | null;
  defaults: { phone: string; whatsapp: string };
  categories: PartCategory[];
  brands: TruckBrand[];
  locations: LocationRow[];
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(() => initialForm(part, defaults));
  const [images, setImages] = useState<UploadedImage[]>(
    () => part?.images?.map((image) => ({ path: image.path, isPrimary: image.is_primary })) ?? [],
  );
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const steps = [
    t('sell.basics'),
    t('sell.pricing'),
    t('sell.photos'),
    t('sell.details'),
    t('sell.contact'),
    t('sell.preview'),
  ];

  const compatibleModels = useMemo(
    () =>
      form.compatibleModels
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .slice(0, 20),
    [form.compatibleModels],
  );

  const quality = useMemo(
    () =>
      scorePart({
        price: Number(form.price) || 0,
        part_number: form.partNumber,
        oem_number: form.oemNumber,
        part_type: form.partType || null,
        compatible_brand_id: form.compatibleBrandId || null,
        compatible_models: compatibleModels,
        description: form.description,
        whatsapp: form.whatsapp,
        location_id: form.locationId,
        imageCount: images.length,
      }),
    [form, compatibleModels, images.length],
  );

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validateStep(): string | null {
    if (step === 0 && (!form.categoryId || form.title.trim().length < 4 || !form.locationId)) {
      return t('errors.invalidInput');
    }
    if (step === 1 && (form.price === '' || Number(form.price) < 0)) return t('errors.invalidInput');
    if (step === 2 && images.length === 0) return t('sell.requiredPhotos');
    if (step === 4 && form.phone.trim().length < 7) return t('errors.invalidInput');
    return null;
  }

  function next() {
    const problem = validateStep();
    if (problem) {
      setError(problem);
      return;
    }
    setError(null);
    if (step < steps.length - 1) setStep(step + 1);
  }

  function submit(publish: boolean) {
    setError(null);
    startTransition(async () => {
      const result = await savePart({
        id: part?.id,
        categoryId: form.categoryId,
        title: form.title,
        brand: form.brand,
        partNumber: form.partNumber,
        oemNumber: form.oemNumber,
        condition: form.condition,
        partType: form.partType || null,
        compatibleBrandId: form.compatibleBrandId || null,
        compatibleModels,
        price: form.price,
        currency: form.currency,
        negotiable: form.negotiable,
        description: form.description,
        locationId: form.locationId,
        phone: form.phone,
        whatsapp: form.whatsapp,
        dealerId,
        images,
        publish,
      });

      if (!result.ok) {
        setError(result.reason === 'auth' ? t('errors.unauthorized') : t('errors.generic'));
        return;
      }
      router.push(`${routes.accountListings(locale)}?saved=${result.status}`);
      router.refresh();
    });
  }

  return (
    <WizardShell
      step={step}
      steps={steps}
      onBack={() => setStep(Math.max(0, step - 1))}
      onNext={step === steps.length - 1 ? () => submit(true) : next}
      nextLabel={step === steps.length - 1 ? t('sell.publish') : undefined}
      nextDisabled={pending}
      error={error}
    >
      {step === 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('part.category')} id="p-category" required>
            <select
              id="p-category"
              className="field"
              value={form.categoryId}
              onChange={(e) => set('categoryId', e.target.value)}
            >
              <option value="">—</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {localisedName(category, locale)}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t('sell.title_field')} id="p-title" required>
            <input
              id="p-title"
              className="field"
              maxLength={120}
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </Field>

          <Field label={t('part.partBrand')} id="p-brand">
            <input
              id="p-brand"
              className="field"
              value={form.brand}
              onChange={(e) => set('brand', e.target.value)}
            />
          </Field>

          <Field label={t('part.partNumber')} id="p-number">
            <input
              id="p-number"
              className="field"
              value={form.partNumber}
              onChange={(e) => set('partNumber', e.target.value)}
            />
          </Field>

          <Field label={t('part.oemNumber')} id="p-oem">
            <input
              id="p-oem"
              className="field"
              value={form.oemNumber}
              onChange={(e) => set('oemNumber', e.target.value)}
            />
          </Field>

          <Field label={t('part.condition')} id="p-condition">
            <select
              id="p-condition"
              className="field"
              value={form.condition}
              onChange={(e) => set('condition', e.target.value as Form['condition'])}
            >
              <option value="new">{t('condition.new')}</option>
              <option value="used">{t('condition.used')}</option>
              <option value="rebuilt">{t('condition.rebuilt')}</option>
            </select>
          </Field>

          <Field label={t('filters.partType')} id="p-type">
            <select
              id="p-type"
              className="field"
              value={form.partType}
              onChange={(e) => set('partType', e.target.value as Form['partType'])}
            >
              <option value="">—</option>
              <option value="original">{t('partType.original')}</option>
              <option value="aftermarket">{t('partType.aftermarket')}</option>
            </select>
          </Field>

          <Field label={t('filters.compatibleBrand')} id="p-compat-brand">
            <select
              id="p-compat-brand"
              className="field"
              value={form.compatibleBrandId}
              onChange={(e) => set('compatibleBrandId', e.target.value)}
            >
              <option value="">—</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t('part.compatibility')} id="p-compat-models" className="sm:col-span-2">
            <input
              id="p-compat-models"
              className="field"
              placeholder="FH, FH16, FM"
              value={form.compatibleModels}
              onChange={(e) => set('compatibleModels', e.target.value)}
            />
          </Field>

          <Field label={t('filters.location')} id="p-location" required>
            <select
              id="p-location"
              className="field"
              value={form.locationId}
              onChange={(e) => set('locationId', e.target.value)}
            >
              <option value="">—</option>
              {locations.map((location) => (
                <option key={location.id} value={location.id}>
                  {localisedName(location, locale)}
                </option>
              ))}
            </select>
          </Field>
        </div>
      )}

      {step === 1 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('sell.price')} id="p-price" required>
            <input
              id="p-price"
              type="number"
              inputMode="numeric"
              min={0}
              className="field"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
            />
          </Field>

          <Field label={t('sell.currency')} id="p-currency">
            <select
              id="p-currency"
              className="field"
              value={form.currency}
              onChange={(e) => set('currency', e.target.value as Form['currency'])}
            >
              {CURRENCIES.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </Field>

          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input
              type="checkbox"
              className="h-4 w-4"
              checked={form.negotiable}
              onChange={(e) => set('negotiable', e.target.checked)}
            />
            {t('sell.isNegotiable')}
          </label>
        </div>
      )}

      {step === 2 && (
        <ImageUploader userId={userId} kind="part" images={images} onChange={setImages} />
      )}

      {step === 3 && (
        <Field label={t('listing.description')} id="p-description">
          <textarea
            id="p-description"
            rows={8}
            className="field"
            maxLength={4000}
            placeholder={t('sell.descriptionHint')}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </Field>
      )}

      {step === 4 && (
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label={t('sell.phone')} id="p-phone" required>
            <input
              id="p-phone"
              type="tel"
              inputMode="tel"
              className="field"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
            />
          </Field>

          <Field label={t('sell.whatsappNumber')} id="p-whatsapp">
            <input
              id="p-whatsapp"
              type="tel"
              inputMode="tel"
              className="field"
              value={form.whatsapp}
              onChange={(e) => set('whatsapp', e.target.value)}
            />
          </Field>

          <button
            type="button"
            className="btn btn-outline w-fit"
            onClick={() => set('whatsapp', form.phone)}
          >
            {t('sell.sameAsPhone')}
          </button>
        </div>
      )}

      {step === 5 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-text)]">{form.title}</h2>
            <p className="text-sm text-[var(--color-muted)]">
              {localisedName(
                categories.find((c) => c.id === form.categoryId),
                locale,
              )}{' '}
              · {t(`condition.${form.condition}`)}
            </p>
            <p className="mt-2 text-xl font-extrabold text-[var(--color-text)]">
              {formatPrice(Number(form.price), form.currency, locale)}
            </p>
          </div>

          <QualityMeter score={quality.score} suggestions={quality.suggestions} />

          <button
            type="button"
            onClick={() => submit(false)}
            disabled={pending}
            className="btn btn-outline w-full"
          >
            {t('sell.saveDraft')}
          </button>
        </div>
      )}
    </WizardShell>
  );
}

function Field({
  label,
  id,
  required,
  className,
  children,
}: {
  label: string;
  id: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={className}>
      <label className="label" htmlFor={id}>
        {label}
        {required && <span className="text-[var(--color-bad)]"> *</span>}
      </label>
      {children}
    </div>
  );
}
