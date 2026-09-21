/**
 * Seeds demo sellers, a dealer and a handful of listings so the UI can be
 * exercised end to end. Idempotent: re-running updates the same rows.
 *
 *   npm.cmd run seed
 *
 * Needs SUPABASE_SERVICE_ROLE_KEY. Never run it against a project with real users.
 */
import { createClient } from '@supabase/supabase-js';
import { describe, fail, readSupabaseEnv } from './supabase-env.mjs';

const { url, serviceKey } = readSupabaseEnv({ needsPublishable: false, softExit: true, task: 'The seed script' });
const db = createClient(url, serviceKey, { auth: { persistSession: false } });

const DEMO_PASSWORD = 'SafinDemo!2026';
const DEMO_USERS = [
  { key: 'dealer', email: 'demo.dealer@safintrucks.test', name: 'Zagros Heavy Trucks', phone: '07500000001' },
  { key: 'seller', email: 'demo.seller@safintrucks.test', name: 'Demo Seller', phone: '07500000002' },
  { key: 'admin', email: 'demo.admin@safintrucks.test', name: 'Demo Admin', phone: '07500000003', role: 'admin' },
];

/** Finds an auth user by email across pages, or null. */
async function findAuthUser(email) {
  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) fail('Could not list Supabase auth users', error);
    const users = data?.users ?? [];
    const match = users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (users.length < 200) return null;
  }
  return null;
}

async function ensureUser({ email, name, phone, role }) {
  let user = await findAuthUser(email);

  if (!user) {
    const { data, error } = await db.auth.admin.createUser({
      email,
      password: DEMO_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: name },
    });

    if (error) {
      // Another run may have created it between the lookup and the insert.
      if (/already/i.test(error.message ?? '')) user = await findAuthUser(email);
      else fail(`Could not create the demo user ${email}`, error);
    } else {
      user = data?.user ?? null;
    }
  }

  if (!user?.id) {
    fail(
      `Could not create or find the demo user ${email}`,
      new Error('Supabase returned no user record. The service-role key may lack admin rights.'),
    );
  }

  // The auth trigger creates the profile row; wait briefly if it has not landed yet.
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const { data } = await db.from('profiles').select('id').eq('id', user.id).maybeSingle();
    if (data) break;
    if (attempt === 4) {
      await db.from('profiles').insert({ id: user.id, full_name: name, phone });
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 300));
  }

  const { error: profileError } = await db
    .from('profiles')
    .update({ full_name: name, phone, whatsapp: phone, role: role ?? 'user' })
    .eq('id', user.id);
  if (profileError) fail(`Could not update the profile for ${email}`, profileError);

  return user.id;
}

// Columns the schema declares NOT NULL. A batch upsert is normalised by PostgREST
// into a single column list, so a key present on only some rows is sent as NULL for
// the others — which is how `featured` ended up violating its NOT NULL constraint.
const NOT_NULL_COLUMNS = {
  trucks: [
    'seller_id', 'slug', 'brand_id', 'title', 'year', 'condition', 'price', 'currency',
    'negotiable', 'location_id', 'phone', 'status', 'featured', 'verified_listing',
    'quality_score', 'views_count',
  ],
  parts: [
    'seller_id', 'slug', 'category_id', 'title', 'condition', 'price', 'currency',
    'negotiable', 'location_id', 'phone', 'status', 'featured', 'quality_score', 'views_count',
  ],
};

/** Gives every row the same shape, and refuses to send NULL into a NOT NULL column. */
function alignRows(table, rows) {
  const keys = [...new Set(rows.flatMap((row) => Object.keys(row)))];
  const guarded = NOT_NULL_COLUMNS[table].filter((key) => keys.includes(key));

  return rows.map((row, index) => {
    const aligned = {};
    for (const key of keys) aligned[key] = key in row ? row[key] : null;

    for (const key of guarded) {
      if (aligned[key] === null || aligned[key] === undefined) {
        fail(
          `Seed data for "${table}" is invalid`,
          new Error(
            `Row ${index + 1} ("${row.slug ?? 'no slug'}") has no value for the NOT NULL column "${key}".`,
          ),
        );
      }
    }
    return aligned;
  });
}

function pick(rows, slug, label) {
  const match = (rows ?? []).find((row) => row.slug === slug);
  if (!match) {
    fail(
      'Reference data is incomplete',
      new Error(`No ${label} with slug "${slug}". Run supabase/migrations/0002_taxonomy.sql first.`),
    );
  }
  return match.id;
}

async function main() {
  const ids = {};
  for (const user of DEMO_USERS) ids[user.key] = await ensureUser(user);

  const [brands, types, locations, categories] = await Promise.all([
    db.from('truck_brands').select('id, slug'),
    db.from('truck_types').select('id, slug'),
    db.from('locations').select('id, slug'),
    db.from('part_categories').select('id, slug'),
  ]);

  for (const [label, result] of Object.entries({ brands, types, locations, categories })) {
    if (result.error) fail(`Could not read ${label}`, result.error);
  }
  if (!brands.data?.length) {
    fail(
      'Reference data is missing',
      new Error('Run supabase/migrations/0001_init.sql and 0002_taxonomy.sql before seeding.'),
    );
  }

  const brand = (slug) => pick(brands.data, slug, 'truck brand');
  const type = (slug) => pick(types.data, slug, 'truck type');
  const place = (slug) => pick(locations.data, slug, 'location');
  const category = (slug) => pick(categories.data, slug, 'part category');

  const { data: dealer, error: dealerError } = await db
    .from('dealers')
    .upsert(
      {
        owner_id: ids.dealer,
        slug: 'zagros-heavy-trucks',
        business_name: 'Zagros Heavy Trucks',
        description: 'Demo dealer account for Safeen Trucks. Euro 5 and Euro 6 tractor units.',
        phone: '07500000001',
        whatsapp: '07500000001',
        location_id: place('erbil'),
        verified: true,
        active: true,
      },
      { onConflict: 'slug' },
    )
    .select('id')
    .single();
  if (dealerError || !dealer?.id) fail('Could not create the demo dealer', dealerError);

  await db.from('profiles').update({ role: 'dealer' }).eq('id', ids.dealer);

  const now = new Date().toISOString();
  const truck = (overrides) => ({
    seller_id: ids.dealer,
    dealer_id: dealer.id,
    condition: 'used',
    currency: 'USD',
    negotiable: true,
    status: 'published',
    published_at: now,
    phone: '07500000001',
    whatsapp: '07500000001',
    quality_score: 75,
    featured: false,
    verified_listing: false,
    ...overrides,
  });

  const trucks = [
    truck({
      slug: 'volvo-fh500-2022-demo01',
      brand_id: brand('volvo'),
      truck_type_id: type('tractor-unit'),
      title: 'Volvo FH500 2022 — low mileage',
      year: 2022,
      mileage_km: 420000,
      horsepower: 500,
      engine: 'D13K',
      transmission: 'automatic',
      axle_configuration: '6x2',
      emission_class: 'Euro 6',
      color: 'White',
      price: 68000,
      location_id: place('erbil'),
      featured: true,
      description:
        'Single owner, full service history, new tyres front and rear. Ready to work, papers clear.',
    }),
    truck({
      slug: 'scania-r500-2021-demo02',
      brand_id: brand('scania'),
      truck_type_id: type('tractor-unit'),
      title: 'Scania R500 2021',
      year: 2021,
      mileage_km: 510000,
      horsepower: 500,
      engine: 'DC13',
      transmission: 'automatic',
      axle_configuration: '6x4',
      emission_class: 'Euro 5',
      color: 'Blue',
      price: 61500,
      location_id: place('sulaymaniyah'),
      description: 'Retarder, sleeper cab, workshop maintained. Available for inspection.',
    }),
    truck({
      seller_id: ids.seller,
      dealer_id: null,
      slug: 'mercedes-actros-1845-2019-demo03',
      brand_id: brand('mercedes-benz'),
      truck_type_id: type('tractor-unit'),
      title: 'Mercedes-Benz Actros 1845 2019',
      year: 2019,
      mileage_km: 680000,
      horsepower: 450,
      engine: 'OM471',
      transmission: 'automatic',
      axle_configuration: '4x2',
      emission_class: 'Euro 6',
      color: 'Silver',
      price: 47000,
      location_id: place('duhok'),
      phone: '07500000002',
      whatsapp: '07500000002',
      description: 'Private sale. Good condition, new clutch, ready for long haul work.',
    }),
    truck({
      slug: 'man-tgx-18-480-2020-demo04',
      brand_id: brand('man'),
      truck_type_id: type('tipper'),
      title: 'MAN TGX 18.480 2020 tipper',
      year: 2020,
      mileage_km: 390000,
      horsepower: 480,
      engine: 'D26',
      transmission: 'manual',
      axle_configuration: '6x4',
      emission_class: 'Euro 5',
      color: 'Yellow',
      price: 55000,
      location_id: place('baghdad'),
      description: 'Construction spec tipper, strong chassis, new hydraulic pump.',
    }),
  ];

  const { error: trucksError } = await db
    .from('trucks')
    .upsert(alignRows('trucks', trucks), { onConflict: 'slug' });
  if (trucksError) fail('Could not insert the demo trucks', trucksError);

  const part = (overrides) => ({
    seller_id: ids.dealer,
    dealer_id: dealer.id,
    condition: 'used',
    part_type: 'original',
    currency: 'USD',
    negotiable: true,
    status: 'published',
    published_at: now,
    phone: '07500000001',
    whatsapp: '07500000001',
    quality_score: 70,
    featured: false,
    oem_number: null,
    ...overrides,
  });

  const parts = [
    part({
      slug: 'holset-hx55-turbo-demo01',
      category_id: category('turbo'),
      title: 'Holset HX55 turbocharger — rebuilt',
      brand: 'Holset',
      part_number: 'HX55',
      oem_number: '4033000',
      condition: 'rebuilt',
      compatible_brand_id: brand('volvo'),
      compatible_models: ['FH', 'FM'],
      price: 950,
      negotiable: false,
      location_id: place('erbil'),
      description: 'Fully rebuilt and tested, 6 month warranty on the cartridge.',
    }),
    part({
      seller_id: ids.seller,
      dealer_id: null,
      slug: 'scania-gearbox-gr875-demo02',
      category_id: category('gearbox'),
      title: 'Scania GR875 gearbox',
      brand: 'Scania',
      part_number: 'GR875',
      compatible_brand_id: brand('scania'),
      compatible_models: ['R-Series', 'G-Series'],
      price: 2800,
      location_id: place('sulaymaniyah'),
      phone: '07500000002',
      whatsapp: '07500000002',
      quality_score: 65,
      description: 'Removed from a running truck, no noise, can be tested before purchase.',
    }),
  ];

  const { error: partsError } = await db
    .from('parts')
    .upsert(alignRows('parts', parts), { onConflict: 'slug' });
  if (partsError) fail('Could not insert the demo parts', partsError);

  console.log('Seeded 3 demo users, 1 verified dealer, 4 trucks and 2 parts.');
  console.log(`Demo accounts: ${DEMO_USERS.map((u) => u.email).join(', ')}`);
  console.log(`Demo password: ${DEMO_PASSWORD}`);
  console.log('Admin account: demo.admin@safintrucks.test');
  console.log('Listings have no photos — add some from the Sell flow to see the cards in full.');
}

main().catch((error) => {
  console.error(`\nSeeding failed: ${describe(error)}\n`);
  process.exit(1);
});
