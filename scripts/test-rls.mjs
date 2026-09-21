/**
 * Integration checks for the row level security policies — the rules trust and
 * money depend on. They run against a real project:
 *
 *   npm.cmd run test:rls
 *
 * Creates two throwaway users and deletes them afterwards. Without usable
 * credentials it reports SKIPPED and exits 0 rather than failing the build.
 */
import { createClient } from '@supabase/supabase-js';
import { describe, fail, readSupabaseEnv } from './supabase-env.mjs';

const { url, publishableKey, serviceKey } = readSupabaseEnv({
  softExit: true,
  task: 'The RLS test suite',
});

const admin = createClient(url, serviceKey, { auth: { persistSession: false } });
const anon = createClient(url, publishableKey, { auth: { persistSession: false } });

let failures = 0;
function check(name, passed, detail) {
  console.log(`${passed ? 'PASS' : 'FAIL'}  ${name}`);
  if (!passed) {
    failures += 1;
    if (detail) console.log(`      ${detail}`);
  }
}

const password = `Rls!${Date.now()}aA`;
const created = [];

async function makeUser(label) {
  const email = `rls.${label}.${Date.now()}@safintrucks.test`;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data?.user?.id) fail('Could not create a test user', error);
  created.push(data.user.id);

  const client = createClient(url, publishableKey, { auth: { persistSession: false } });
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) fail(`Could not sign in as the test user ${label}`, signInError);
  return { id: data.user.id, client };
}

async function main() {
  const { data: reachable, error: reachError } = await admin
    .from('truck_brands')
    .select('id, slug')
    .limit(1);
  if (reachError) fail('Could not reach the database', reachError);
  if (!reachable?.length) {
    fail(
      'Reference data is missing',
      new Error('Run the migrations in supabase/migrations/ before the RLS tests.'),
    );
  }

  const { data: location, error: locationError } = await admin
    .from('locations')
    .select('id')
    .limit(1)
    .maybeSingle();
  if (locationError || !location?.id) fail('Could not read locations', locationError);

  const alice = await makeUser('a');
  const bob = await makeUser('b');

  const base = {
    brand_id: reachable[0].id,
    location_id: location.id,
    title: 'RLS test truck',
    year: 2020,
    price: 1000,
    currency: 'USD',
    condition: 'used',
    phone: '07500000000',
  };

  const { data: published, error: publishedError } = await alice.client
    .from('trucks')
    .insert({
      ...base,
      seller_id: alice.id,
      slug: `rls-published-${Date.now()}`,
      status: 'pending',
    })
    .select('id, status')
    .single();
  check(
    'policy trucks_insert: a seller can create their own listing',
    !publishedError && !!published?.id,
    publishedError ? describe(publishedError) : undefined,
  );
  if (!published?.id) {
    console.log('\nCannot continue without a test listing.');
    failures += 1;
    return;
  }

  check(
    'trigger protect_listing_insert: a new listing cannot start published',
    published.status === 'pending',
    `status is "${published.status}"`,
  );

  // Approve it the way a moderator would, so the public-read checks have a live listing.
  await admin
    .from('trucks')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', published.id);

  const { data: draft, error: draftError } = await alice.client
    .from('trucks')
    .insert({ ...base, seller_id: alice.id, slug: `rls-draft-${Date.now()}`, status: 'draft' })
    .select('id')
    .single();
  check(
    'policy trucks_insert: a seller can create a draft',
    !draftError && !!draft?.id,
    draftError ? describe(draftError) : undefined,
  );

  const { error: spoofError } = await bob.client.from('trucks').insert({
    ...base,
    seller_id: alice.id,
    slug: `rls-spoof-${Date.now()}`,
    status: 'draft',
  });
  check(
    'policy trucks_insert: cannot create a listing owned by someone else',
    !!spoofError,
    spoofError ? undefined : 'The insert was accepted — seller_id is not bound to auth.uid().',
  );

  const { data: publicRead } = await anon.from('trucks').select('id').eq('id', published.id);
  check(
    'policy trucks_read_public: anonymous visitors can read published listings',
    publicRead?.length === 1,
    `expected 1 row, got ${publicRead?.length ?? 0}`,
  );

  if (draft?.id) {
    const { data: draftRead } = await anon.from('trucks').select('id').eq('id', draft.id);
    check(
      'policy trucks_read_public: drafts are not public',
      draftRead?.length === 0,
      `expected 0 rows, got ${draftRead?.length ?? 0}`,
    );

    const { data: otherDraft } = await bob.client.from('trucks').select('id').eq('id', draft.id);
    check(
      'policy trucks_read_public: another seller cannot read your draft',
      otherDraft?.length === 0,
      `expected 0 rows, got ${otherDraft?.length ?? 0}`,
    );
  }

  await bob.client.from('trucks').update({ price: 1 }).eq('id', published.id);
  const { data: afterEdit } = await admin
    .from('trucks')
    .select('price')
    .eq('id', published.id)
    .single();
  check(
    'policy trucks_update: a seller cannot edit another seller listing',
    Number(afterEdit?.price) === 1000,
    `price is now ${afterEdit?.price}, expected 1000`,
  );

  await bob.client.from('trucks').delete().eq('id', published.id);
  const { data: afterDelete } = await admin.from('trucks').select('id').eq('id', published.id);
  check(
    'policy trucks_delete: a seller cannot delete another seller listing',
    afterDelete?.length === 1,
    'the listing was deleted by a different seller',
  );

  await bob.client.from('profiles').update({ role: 'admin' }).eq('id', bob.id);
  const { data: role } = await admin.from('profiles').select('role').eq('id', bob.id).single();
  check(
    'policy profiles_update_own: a user cannot promote themselves to admin',
    role?.role === 'user',
    `role is now "${role?.role}"`,
  );

  const favorite = { user_id: bob.id, listing_kind: 'truck', listing_id: published.id };
  await bob.client.from('favorites').insert(favorite);
  const { error: duplicateError } = await bob.client.from('favorites').insert(favorite);
  check(
    'favorites primary key: a listing cannot be favourited twice',
    !!duplicateError,
    'the duplicate insert succeeded',
  );

  const { error: foreignFavoriteError } = await bob.client
    .from('favorites')
    .insert({ ...favorite, user_id: alice.id });
  check(
    'policy favorites_own: cannot favourite on behalf of someone else',
    !!foreignFavoriteError,
    'the insert was accepted',
  );

  const { data: reportsRead } = await bob.client.from('reports').select('id');
  check(
    'policy reports_read: non-admins cannot read other peoples reports',
    (reportsRead ?? []).length === 0,
    `got ${(reportsRead ?? []).length} rows`,
  );

  const { data: eventsRead } = await bob.client.from('contact_events').select('id').limit(1);
  check(
    'policy events_read: non-admins cannot read contact analytics',
    (eventsRead ?? []).length === 0,
    `got ${(eventsRead ?? []).length} rows`,
  );

  await alice.client.from('trucks').update({ featured: true }).eq('id', published.id);
  const { data: featuredRow } = await admin
    .from('trucks')
    .select('featured')
    .eq('id', published.id)
    .single();
  check(
    'trigger protect_truck_fields: a seller cannot feature their own listing',
    featuredRow?.featured === false,
    'featured became true',
  );

  if (draft?.id) {
    await alice.client
      .from('trucks')
      .update({ status: 'published', published_at: new Date().toISOString() })
      .eq('id', draft.id);
    const { data: draftRow } = await admin
      .from('trucks')
      .select('status')
      .eq('id', draft.id)
      .single();
    check(
      'trigger protect_truck_fields: a seller cannot self-publish a draft',
      draftRow?.status === 'draft',
      `status is now "${draftRow?.status}"`,
    );
  }

  const { data: dealerRow } = await bob.client
    .from('dealers')
    .insert({
      owner_id: bob.id,
      slug: `rls-dealer-${Date.now()}`,
      business_name: 'RLS test dealer',
      verified: true,
    })
    .select('id, verified')
    .single();
  check(
    'trigger protect_dealer_fields: a dealer cannot self-verify',
    dealerRow ? dealerRow.verified === false : true,
    'verified was accepted as true',
  );
  if (dealerRow?.id) await admin.from('dealers').delete().eq('id', dealerRow.id);
}

let exitCode = 0;
try {
  await main();
} catch (error) {
  console.error(`\nUnexpected error: ${describe(error)}`);
  failures += 1;
} finally {
  for (const id of created) {
    const { error } = await admin.auth.admin.deleteUser(id);
    if (error) console.error(`Could not delete test user ${id}: ${describe(error)}`);
  }
  if (failures === 0) {
    console.log('\nAll RLS checks passed.');
  } else {
    console.log(`\n${failures} RLS check(s) failed — see the FAIL lines above.`);
    exitCode = 1;
  }
}
process.exit(exitCode);
