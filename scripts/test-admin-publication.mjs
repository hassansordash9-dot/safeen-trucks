// Requires the deployed migrations and privileged test credentials. Never treats a skip as a pass.
import assert from 'node:assert/strict';
import { createClient } from '@supabase/supabase-js';
import { readSupabaseEnv } from './supabase-env.mjs';

const { url, publishableKey, serviceKey } = readSupabaseEnv({ task: 'Admin publication integration tests' });
const options = { auth: { persistSession: false, autoRefreshToken: false } };
const service = createClient(url, serviceKey, options);
const anon = createClient(url, publishableKey, options);
const accounts = [], records = [], photos = [];
const suffix = crypto.randomUUID();
async function must(result) {
  assert.ifError(result.error);
  return result.data;
}
async function account(label, confirmed, role) {
  const email = `safeen-access-${label}-${suffix}@example.com`;
  const password = `Test!${crypto.randomUUID()}Aa1`;
  const { user } = await must(await service.auth.admin.createUser({ email, password, email_confirm: confirmed }));
  accounts.push(user.id);
  await must(await service.from('profiles').update({ role }).eq('id', user.id));
  const client = createClient(url, publishableKey, options);
  if (confirmed) await must(await client.auth.signInWithPassword({ email, password }));
  return { id: user.id, client, email, password };
}
try {
  const admin = await account('admin', true, 'admin');
  const visitor = await account('visitor', true, 'user');
  const unconfirmed = await account('unconfirmed', false, 'admin');
  const unconfirmedLogin = await unconfirmed.client.auth.signInWithPassword({
    email: unconfirmed.email, password: unconfirmed.password,
  });
  if (unconfirmedLogin.data.session) {
    assert.equal(await must(await unconfirmed.client.rpc('is_admin')), false);
  } else {
    assert.ok(unconfirmedLogin.error, 'unconfirmed login must be refused');
  }
  const location = (await must(await service.from('locations').select('id').limit(1).single())).id;
  const brand = (await must(await service.from('truck_brands').select('id').limit(1).single())).id;
  const category = (await must(await service.from('part_categories').select('id').limit(1).single())).id;
  for (const [table, imageTable, fk, kind, taxonomy] of [
    ['trucks','truck_images','truck_id','truck',{brand_id: brand, year: 2020}],
    ['parts','part_images','part_id','part',{category_id: category}],
  ]) {
    const base = { ...taxonomy, seller_id: admin.id, title: 'X', price: 1000,
      currency: 'USD', condition: 'used', location_id: location, phone: '07501234567', description: null };
    assert.ok((await visitor.client.from(table).insert({ ...base, slug: `denied-${kind}-${suffix}`, status: 'published' })).error);
    const draft = await must(await admin.client.from(table).insert({ ...base, slug: `access-${kind}-${suffix}`, status: 'draft' }).select('id').single());
    records.push([table,draft.id]);
    assert.deepEqual(await must(await anon.from(table).select('id').eq('id',draft.id)), []);
    // A valid tiny PNG is accepted regardless of its semantic subject.
    const path = `${admin.id}/${kind}/${suffix}.png`;
    const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aF9sAAAAASUVORK5CYII=', 'base64');
    await must(await admin.client.storage.from('listings').upload(path,png,{contentType:'image/png'}));
    photos.push(path);
    await must(await admin.client.from(imageTable).insert({[fk]:draft.id,path,is_primary:true}));
    assert.ok((await anon.storage.from('listings').download(path)).error, 'draft photo must be private');
    assert.equal((await anon.storage.from('listings').getPublicUrl(path)).data.publicUrl.includes('/public/'),true);
    const publicResponse = await fetch(anon.storage.from('listings').getPublicUrl(path).data.publicUrl);
    assert.equal(publicResponse.ok,false,'public bucket endpoint must refuse draft photos');
    await must(await admin.client.from(table).update({status:'published'}).eq('id',draft.id));
    const published = await must(await anon.from(table).select('id,price,phone,published_at').eq('id',draft.id).single());
    assert.equal(Number(published.price),1000);
    assert.equal(published.phone,base.phone);
    assert.ok(published.published_at);
    await must(await anon.storage.from('listings').download(path));
    await visitor.client.from(table).update({price:1}).eq('id',draft.id);
    assert.equal(Number((await must(await service.from(table).select('price').eq('id',draft.id).single())).price),1000);
    await visitor.client.from(table).delete().eq('id',draft.id);
    await must(await service.from(table).select('id').eq('id',draft.id).single());
    await must(await admin.client.from(table).update({status:'draft'}).eq('id',draft.id));
    assert.ok((await anon.storage.from('listings').download(path)).error, 'unpublishing revokes photo access');
    await must(await admin.client.from(table).delete().eq('id',draft.id));
    console.log(`PASS ${kind}: admin CRUD, optional content, anonymous public access, private drafts/photos`);
  }
  await admin.client.from('profiles').update({role:'admin'}).eq('id',visitor.id);
  assert.equal((await must(await service.from('profiles').select('role').eq('id',visitor.id).single())).role,'user');
  await visitor.client.from('profiles').update({role:'admin'}).eq('id',visitor.id);
  assert.equal((await must(await service.from('profiles').select('role').eq('id',visitor.id).single())).role,'user');
  await must(await service.from('profiles').update({status:'suspended'}).eq('id',admin.id));
  assert.equal(await must(await admin.client.rpc('is_admin')),false);
  console.log('PASS role escalation protection and suspended-admin denial');
} finally {
  for (const [table,id] of records) await must(await service.from(table).delete().eq('id',id));
  if (photos.length) await must(await service.storage.from('listings').remove(photos));
  for (const id of accounts) await must(await service.auth.admin.deleteUser(id));
}
