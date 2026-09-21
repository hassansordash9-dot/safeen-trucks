import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { normalisePhone, slugify, listingSlug, telUrl, whatsappUrl } from '../src/lib/utils.ts';
import { scorePart, scoreTruck } from '../src/lib/quality.ts';
import { createTranslator } from '../src/i18n/translate.ts';
import { isLocale, localeDir, locales } from '../src/i18n/config.ts';
import { parseTruckFilters, truckFiltersToParams } from '../src/features/trucks/filters.ts';
import { parsePartFilters } from '../src/features/parts/filters.ts';
import { truckInputSchema, partInputSchema } from '../src/features/trucks/schema.ts';
import { validateImageFile, MAX_IMAGE_BYTES } from '../src/lib/images.ts';
import en from '../src/locales/en.json' with { type: 'json' };
import ku from '../src/locales/ku.json' with { type: 'json' };
import ar from '../src/locales/ar.json' with { type: 'json' };

describe('phone and contact links', () => {
  it('converts local Iraqi numbers to international form', () => {
    assert.equal(normalisePhone('0750 123 4567'), '9647501234567');
    assert.equal(normalisePhone('+964 750 123 4567'), '9647501234567');
    assert.equal(normalisePhone('00964-750-1234567'), '9647501234567');
  });

  it('returns null for empty or unusable input', () => {
    assert.equal(normalisePhone(''), null);
    assert.equal(normalisePhone(null), null);
    assert.equal(whatsappUrl('123', 'hi'), null);
  });

  it('builds an encoded WhatsApp link', () => {
    const url = whatsappUrl('0750 123 4567', 'Hello, is the Volvo FH500 available?');
    assert.ok(url?.startsWith('https://wa.me/9647501234567?text='));
    assert.ok(url?.includes('Volvo%20FH500'));
    assert.ok(!url?.includes(' '));
  });

  it('builds a tel link', () => {
    assert.equal(telUrl('0750 123 4567'), 'tel:+9647501234567');
  });
});

describe('slugs', () => {
  it('produces readable url-safe slugs', () => {
    assert.equal(slugify('Volvo FH500 2022 — Low Mileage!'), 'volvo-fh500-2022-low-mileage');
  });

  it('appends a short id so listing slugs stay unique', () => {
    const a = listingSlug(['Volvo FH500', 2022]);
    const b = listingSlug(['Volvo FH500', 2022]);
    assert.ok(a.startsWith('volvo-fh500-2022-'));
    assert.notEqual(a, b);
  });
});

describe('listing quality score', () => {
  it('rewards a complete truck listing', () => {
    const result = scoreTruck({
      price: 68000,
      mileage_km: 420000,
      horsepower: 500,
      engine: 'D13K',
      transmission: 'automatic',
      axle_configuration: '6x2',
      description: 'x'.repeat(200),
      whatsapp: '07501234567',
      location_id: 'loc',
      imageCount: 6,
    });
    assert.equal(result.score, 100);
    assert.deepEqual(result.suggestions, []);
  });

  it('flags the gaps in a thin truck listing', () => {
    const result = scoreTruck({ price: 0, description: '', imageCount: 0 });
    assert.ok(result.score < 30);
    assert.ok(result.suggestions.includes('quality.addPhotos'));
    assert.ok(result.suggestions.includes('quality.addPrice'));
    assert.ok(result.suggestions.includes('quality.addMileage'));
  });

  it('scores parts on identifiers and compatibility', () => {
    const result = scorePart({
      price: 900,
      part_number: '21467518',
      oem_number: '21467518',
      part_type: 'original',
      compatible_brand_id: 'brand',
      compatible_models: ['FH'],
      description: 'y'.repeat(150),
      whatsapp: '07501234567',
      location_id: 'loc',
      imageCount: 5,
    });
    assert.equal(result.score, 100);
  });

  it('never exceeds 100', () => {
    const result = scoreTruck({
      price: 1,
      mileage_km: 1,
      horsepower: 1,
      engine: 'e',
      transmission: 'manual',
      axle_configuration: '4x2',
      description: 'z'.repeat(500),
      whatsapp: '1',
      location_id: 'l',
      imageCount: 12,
    });
    assert.ok(result.score <= 100);
  });
});

describe('search filters', () => {
  it('parses query strings into typed filters', () => {
    const filters = parseTruckFilters({
      brand: 'volvo',
      yearFrom: '2020',
      priceTo: '70000',
      sort: 'price_asc',
      page: '2',
    });
    assert.equal(filters.brand, 'volvo');
    assert.equal(filters.yearFrom, 2020);
    assert.equal(filters.priceTo, 70000);
    assert.equal(filters.sort, 'price_asc');
    assert.equal(filters.page, 2);
  });

  it('falls back to safe defaults for junk input', () => {
    const filters = parseTruckFilters({ yearFrom: 'abc', sort: 'cheapest', page: '-5' });
    assert.equal(filters.yearFrom, undefined);
    assert.equal(filters.sort, 'newest');
    assert.equal(filters.page, 1);
  });

  it('round-trips filters back into a shareable query', () => {
    const filters = parseTruckFilters({ brand: 'volvo', yearFrom: '2020' });
    const params = truckFiltersToParams(filters);
    assert.deepEqual(params, { brand: 'volvo', yearFrom: '2020' });


  });

  it('parses part filters including OEM keyword search', () => {
    const filters = parsePartFilters({ q: '21467518', condition: 'rebuilt' });
    assert.equal(filters.q, '21467518');
    assert.equal(filters.condition, 'rebuilt');
  });
});

describe('listing validation', () => {
  const baseTruck = {
    brandId: '6f1d9b3e-4c2a-4f0b-9e21-1a2b3c4d5e6f',
    title: 'Volvo FH500 2022',
    year: 2022,
    condition: 'used',
    price: 68000,
    currency: 'USD',
    negotiable: true,
    locationId: 'a3c1e5d7-8b9f-4a10-bc23-d4e5f6a7b8c9',
    phone: '07501234567',
    images: [{ path: 'user/truck/a.jpg', isPrimary: true }],
    publish: true,
  };

  it('accepts a valid truck', () => {
    assert.equal(truckInputSchema.safeParse(baseTruck).success, true);
  });

  it('rejects a short title', () => {
    assert.equal(truckInputSchema.safeParse({ ...baseTruck, title: 'FH' }).success, false);
  });

  it('rejects an impossible year', () => {
    assert.equal(truckInputSchema.safeParse({ ...baseTruck, year: 1800 }).success, false);
  });

  it('rejects a negative price', () => {
    assert.equal(truckInputSchema.safeParse({ ...baseTruck, price: -1 }).success, false);
  });

  it('rejects more than twelve photos', () => {
    const images = Array.from({ length: 13 }, (_, i) => ({ path: `p${i}.jpg`, isPrimary: false }));
    assert.equal(truckInputSchema.safeParse({ ...baseTruck, images }).success, false);
  });

  it('requires a category on parts', () => {
    const part = {
      title: 'Turbo Holset HX55',
      condition: 'used',
      price: 900,
      currency: 'USD',
      negotiable: false,
      locationId: 'a3c1e5d7-8b9f-4a10-bc23-d4e5f6a7b8c9',
      phone: '07501234567',
      images: [],
      publish: false,
    };
    assert.equal(partInputSchema.safeParse(part).success, false);
    assert.equal(
      partInputSchema.safeParse({ ...part, categoryId: 'b7e2d4c6-1a3f-4b58-9c0d-2e3f4a5b6c7d' })
        .success,
      true,
    );
  });
});

describe('image upload validation', () => {
  it('rejects files that are not allowed image types', () => {
    const file = new File(['x'], 'truck.pdf', { type: 'application/pdf' });
    assert.equal(validateImageFile(file), 'fileType');
  });

  it('rejects oversized images', () => {
    const file = new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], 'truck.jpg', {
      type: 'image/jpeg',
    });
    assert.equal(validateImageFile(file), 'fileTooLarge');
  });

  it('accepts a normal jpeg', () => {
    const file = new File([new Uint8Array(1024)], 'truck.jpg', { type: 'image/jpeg' });
    assert.equal(validateImageFile(file), null);
  });
});

describe('i18n', () => {
  it('sets direction per locale', () => {
    assert.equal(localeDir.en, 'ltr');
    assert.equal(localeDir.ku, 'rtl');
    assert.equal(localeDir.ar, 'rtl');
    assert.deepEqual([...locales], ['en', 'ku', 'ar']);
    assert.equal(isLocale('ku'), true);
    assert.equal(isLocale('fr'), false);
  });

  it('resolves nested keys and interpolates values', () => {
    const t = createTranslator(en);
    assert.equal(t('nav.trucks'), 'Trucks');
    assert.equal(t('sell.qualityScore', { score: 85 }), 'Listing quality: 85/100');
    assert.equal(t('nav.missing'), 'nav.missing');
  });

  it('keeps every locale in sync with English', () => {
    const flatten = (value: unknown, prefix = ''): string[] =>
      typeof value === 'object' && value !== null
        ? Object.entries(value).flatMap(([key, child]) =>
            flatten(child, prefix ? `${prefix}.${key}` : key),
          )
        : [prefix];

    const expected = flatten(en).sort();
    assert.deepEqual(flatten(ku).sort(), expected, 'Kurdish is missing or has extra keys');
    assert.deepEqual(flatten(ar).sort(), expected, 'Arabic is missing or has extra keys');
  });

  it('localises the WhatsApp message in every language', () => {
    for (const dict of [en, ku, ar]) {
      const message = createTranslator(dict)('whatsapp.message', { title: 'Volvo FH500' });
      assert.ok(message.includes('Volvo FH500'));
      assert.ok(!message.includes('{title}'));
    }
  });
});
