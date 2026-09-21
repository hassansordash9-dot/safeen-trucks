'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState, useTransition } from 'react';
import { ImageUploader, type UploadedImage } from '@/components/ImageUploader';
import { QualityMeter, WizardShell } from '@/components/WizardShell';
import { useI18n } from '@/i18n/I18nProvider';
import { formatPrice, localisedName } from '@/lib/format';
import { scoreTruck } from '@/lib/quality';
import { routes } from '@/lib/routes';
import { saveTruck } from './actions';
import { AXLE_CONFIGURATIONS, CURRENCIES, EMISSION_CLASSES, TRANSMISSIONS } from '@/types';
import type { LocationRow, Truck, TruckBrand, TruckModel, TruckType } from '@/types';

type Form = {
  brandId: string;
  modelId: string;
  truckTypeId: string;
  title: string;
  year: string;
  mileageKm: string;
  horsepower: string;
  engine: string;
  transmission: string;
  axleConfiguration: string;
  emissionClass: string;
  condition: 'new' | 'used';
  color: string;
  price: string;
  currency: 'USD' | 'IQD';
  negotiable: boolean;
  description: string;
  locationId: string;
  phone: string;
  whatsapp: string;
};

function initialForm(truck: Truck | null, defaults: { phone: string; whatsapp: string }): Form {
  return {
    brandId: truck?.brand_id ?? '',
    modelId: truck?.model_id ?? '',
    truckTypeId: truck?.truck_type_id ?? '',
    title: truck?.title ?? '',
    year: truck ? String(truck.year) : '',
    mileageKm: truck?.mileage_km != null ? String(truck.mileage_km) : '',
    horsepower: truck?.horsepower != null ? String(truck.horsepower) : '',
    engine: truck?.engine ?? '',
    transmission: truck?.transmission ?? '',
    axleConfiguration: truck?.axle_configuration ?? '',
    emissionClass: truck?.emission_class ?? '',
    condition: truck?.condition ?? 'used',
    color: truck?.color ?? '',
    price: truck ? String(truck.price) : '',
    currency: truck?.currency ?? 'USD',
    negotiable: truck?.negotiable ?? false,
    description: truck?.description ?? '',
    locationId: truck?.location_id ?? '',
    phone: truck?.phone ?? defaults.phone,
    whatsapp: truck?.whatsapp ?? defaults.whatsapp,
  };
}

export function TruckWizard({
  userId,
  truck,
  dealerId,
  defaults,
  brands,
  models,
  types,
  locations,
}: {
  userId: string;
  truck: Truck | null;
  dealerId: string | null;
  defaults: { phone: string; whatsapp: string };
  brands: TruckBrand[];
  models: TruckModel[];
  types: TruckType[];
  locations: LocationRow[];
}) {
  const { t, locale } = useI18n();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<Form>(() => initialForm(truck, defaults));
  const [images, setImages] = useState<UploadedImage[]>(
    () =>
      truck?.images?.map((image) => ({ path: image.path, isPrimary: image.is_primary })) ?? [],
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

  const brandModels = useMemo(
    () => models.filter((model) => model.brand_id === form.brandId),
    [models, form.brandId],
  );

  const quality = useMemo(
    () =>
      scoreTruck({
        price: Number(form.price) || 0,
        mileage_km: form.mileageKm === '' ? null : Number(form.mileageKm),
        horsepower: form.horsepower === '' ? null : Number(form.horsepower),
        engine: form.engine,
        transmission: form.transmission,
        axle_configuration: form.axleConfiguration,
        description: form.description,
        whatsapp: form.whatsapp,
        location_id: form.locationId,
        imageCount: images.length,
      }),
    [form, images.length],
  );

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function validateStep(): string | null {
    if (step === 0) {
      if (!form.brandId || !form.title.trim() || !form.year || !form.locationId) {
        return t('errors.invalidInput');
      }
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
      const result = await saveTruck({
        id: truck?.id,
        brandId: form.brandId,
        modelId: form.modelId || null,
        truckTypeId: form.truckTypeId || null,
        title: form.title,
        year: form.year,
        mileageKm: form.mileageKm === '' ? null : form.mileageKm,
        horsepower: form.horsepower === '' ? null : form.horsepower,
        engine: form.engine,
        transmission: form.transmission || null,
        axleConfiguration: form.axleConfiguration,
        emissionClass: form.emissionClass,
        condition: form.condition,
        color: form.color,
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
          <Field label={t('truck.brand')} id="w-brand" required>
            <select
              id="w-brand"
              className="field"
              value={form.brandId}
              onChange={(e) => {
                set('brandId', e.target.value);
                set('modelId', '');
              }}
            >
              <option value="">—</option>
              {brands.map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t('truck.model')} id="w-model">
            <select
              id="w-model"
              className="field"
              value={form.modelId}
              onChange={(e) => set('modelId', e.target.value)}
              disabled={!brandModels.length}
            >
              <option value="">—</option>
              {brandModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t('sell.title_field')} id="w-title" required className="sm:col-span-2">
            <input
              id="w-title"
              className="field"
              value={form.title}
              maxLength={120}
              placeholder={t('sell.titleHint')}
              onChange={(e) => set('title', e.target.value)}
            />
          </Field>

          <Field label={t('truck.year')} id="w-year" required>
            <input
              id="w-year"
              type="number"
              inputMode="numeric"
              className="field"
              value={form.year}
              onChange={(e) => set('year', e.target.value)}
            />
          </Field>

          <Field label={t('truck.mileage')} id="w-mileage">
            <input
              id="w-mileage"
              type="number"
              inputMode="numeric"
              className="field"
              value={form.mileageKm}
              onChange={(e) => set('mileageKm', e.target.value)}
            />
          </Field>

          <Field label={t('truck.horsepower')} id="w-hp">
            <input
              id="w-hp"
              type="number"
              inputMode="numeric"
              className="field"
              value={form.horsepower}
              onChange={(e) => set('horsepower', e.target.value)}
            />
          </Field>

          <Field label={t('truck.engine')} id="w-engine">
            <input
              id="w-engine"
              className="field"
              value={form.engine}
              onChange={(e) => set('engine', e.target.value)}
            />
          </Field>

          <Field label={t('truck.transmission')} id="w-trans">
            <select
              id="w-trans"
              className="field"
              value={form.transmission}
              onChange={(e) => set('transmission', e.target.value)}
            >
              <option value="">—</option>
              {TRANSMISSIONS.map((value) => (
                <option key={value} value={value}>
                  {t(`transmission.${value}`)}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t('truck.axle')} id="w-axle">
            <select
              id="w-axle"
              className="field"
              value={form.axleConfiguration}
              onChange={(e) => set('axleConfiguration', e.target.value)}
            >
              <option value="">—</option>
              {AXLE_CONFIGURATIONS.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t('truck.emission')} id="w-emission">
            <select
              id="w-emission"
              className="field"
              value={form.emissionClass}
              onChange={(e) => set('emissionClass', e.target.value)}
            >
              <option value="">—</option>
              {EMISSION_CLASSES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t('truck.type')} id="w-type">
            <select
              id="w-type"
              className="field"
              value={form.truckTypeId}
              onChange={(e) => set('truckTypeId', e.target.value)}
            >
              <option value="">—</option>
              {types.map((type) => (
                <option key={type.id} value={type.id}>
                  {localisedName(type, locale)}
                </option>
              ))}
            </select>
          </Field>

          <Field label={t('truck.condition')} id="w-condition">
            <select
              id="w-condition"
              className="field"
              value={form.condition}
              onChange={(e) => set('condition', e.target.value as Form['condition'])}
            >
              <option value="used">{t('condition.used')}</option>
              <option value="new">{t('condition.new')}</option>
            </select>
          </Field>

          <Field label={t('truck.color')} id="w-color">
            <input
              id="w-color"
              className="field"
              value={form.color}
              onChange={(e) => set('color', e.target.value)}
            />
          </Field>

          <Field label={t('filters.location')} id="w-location" required>
            <select
              id="w-location"
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
          <Field label={t('sell.price')} id="w-price" required>
            <input
              id="w-price"
              type="number"
              inputMode="numeric"
              min={0}
              className="field"
              value={form.price}
              onChange={(e) => set('price', e.target.value)}
            />
          </Field>

          <Field label={t('sell.currency')} id="w-currency">
            <select
              id="w-currency"
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
        <ImageUploader userId={userId} kind="truck" images={images} onChange={setImages} />
      )}

      {step === 3 && (
        <Field label={t('listing.description')} id="w-description">
          <textarea
            id="w-description"
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
          <Field label={t('sell.phone')} id="w-phone" required>
            <input
              id="w-phone"
              type="tel"
              inputMode="tel"
              className="field"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
            />
          </Field>

          <Field label={t('sell.whatsappNumber')} id="w-whatsapp">
            <input
              id="w-whatsapp"
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
              {brands.find((b) => b.id === form.brandId)?.name} · {form.year} ·{' '}
              {localisedName(
                locations.find((l) => l.id === form.locationId),
                locale,
              )}
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
