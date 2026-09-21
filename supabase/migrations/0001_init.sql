-- Safin Trucks — initial schema
-- Run in the Supabase SQL editor, or `supabase db push`.

create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm";

-- ---------------------------------------------------------------- enums
create type user_role            as enum ('user','dealer','admin');
create type user_status          as enum ('active','warned','suspended','banned');
create type listing_status       as enum ('draft','pending','published','rejected','paused','sold','expired');
create type listing_kind         as enum ('truck','part');
create type currency_code        as enum ('USD','IQD');
create type truck_condition      as enum ('new','used');
create type part_condition       as enum ('new','used','rebuilt');
create type part_type            as enum ('original','aftermarket');
create type transmission_type    as enum ('manual','automatic','semi_automatic');
create type verification_level   as enum ('phone','identity','business','safin_dealer');
create type verification_status  as enum ('pending','approved','rejected');
create type report_reason        as enum ('fake','scam','wrong_price','wrong_info','sold','duplicate','other');
create type report_status        as enum ('open','resolved','dismissed');
create type contact_event_type   as enum ('view','whatsapp','call','favorite');

-- ------------------------------------------------------------- profiles
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  full_name     text,
  phone         text,
  whatsapp      text,
  avatar_url    text,
  role          user_role   not null default 'user',
  status        user_status not null default 'active',
  locale        text        not null default 'en',
  location_id   uuid,
  admin_note    text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  insert into public.profiles (id, full_name, phone)
  values (new.id, new.raw_user_meta_data->>'full_name', new.phone)
  on conflict (id) do nothing;
  return new;
end $fn$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- SECURITY DEFINER so RLS policies can call these without recursing into profiles.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin');
$fn$;

create or replace function public.is_active()
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (select 1 from public.profiles p
                 where p.id = auth.uid() and p.status in ('active','warned'));
$fn$;

-- ------------------------------------------------------------ taxonomies
create table locations (
  id           uuid primary key default gen_random_uuid(),
  country_code text not null default 'IQ',
  governorate  text not null,
  slug         text not null unique,
  name_en      text not null,
  name_ku      text not null,
  name_ar      text not null,
  sort_order   int  not null default 0
);

alter table profiles add constraint profiles_location_fk
  foreign key (location_id) references locations(id) on delete set null;

create table truck_brands (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name       text not null,
  logo_url   text,
  sort_order int not null default 0,
  active     boolean not null default true
);

create table truck_models (
  id       uuid primary key default gen_random_uuid(),
  brand_id uuid not null references truck_brands(id) on delete cascade,
  slug     text not null,
  name     text not null,
  active   boolean not null default true,
  unique (brand_id, slug)
);

create table truck_types (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name_en    text not null,
  name_ku    text not null,
  name_ar    text not null,
  sort_order int not null default 0
);

create table part_categories (
  id         uuid primary key default gen_random_uuid(),
  slug       text not null unique,
  name_en    text not null,
  name_ku    text not null,
  name_ar    text not null,
  sort_order int not null default 0
);

-- --------------------------------------------------------------- dealers
create table dealers (
  id            uuid primary key default gen_random_uuid(),
  owner_id      uuid not null references profiles(id) on delete cascade,
  slug          text not null unique,
  business_name text not null,
  description   text,
  logo_url      text,
  cover_url     text,
  phone         text,
  whatsapp      text,
  website       text,
  location_id   uuid references locations(id) on delete set null,
  verified      boolean not null default false,
  active        boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index dealers_owner_idx on dealers(owner_id);

-- ---------------------------------------------------------------- trucks
create table trucks (
  id                 uuid primary key default gen_random_uuid(),
  seller_id          uuid not null references profiles(id) on delete cascade,
  dealer_id          uuid references dealers(id) on delete set null,
  slug               text not null unique,
  brand_id           uuid not null references truck_brands(id),
  model_id           uuid references truck_models(id),
  truck_type_id      uuid references truck_types(id),
  title              text not null,
  year               int  not null check (year between 1950 and 2100),
  mileage_km         int  check (mileage_km >= 0),
  horsepower         int  check (horsepower between 0 and 3000),
  engine             text,
  transmission       transmission_type,
  axle_configuration text,
  emission_class     text,
  condition          truck_condition not null default 'used',
  color              text,
  price              numeric(12,2) not null check (price >= 0),
  currency           currency_code not null default 'USD',
  negotiable         boolean not null default false,
  description        text,
  location_id        uuid not null references locations(id),
  phone              text not null,
  whatsapp           text,
  status             listing_status not null default 'draft',
  featured           boolean not null default false,
  verified_listing   boolean not null default false,
  quality_score      int not null default 0,
  views_count        int not null default 0,
  rejection_reason   text,
  reviewed_by        uuid references profiles(id),
  reviewed_at        timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  published_at       timestamptz,
  sold_at            timestamptz
);
create index trucks_browse_idx  on trucks (status, published_at desc);
create index trucks_brand_idx   on trucks (brand_id) where status = 'published';
create index trucks_model_idx   on trucks (model_id) where status = 'published';
create index trucks_loc_idx     on trucks (location_id) where status = 'published';
create index trucks_price_idx   on trucks (price) where status = 'published';
create index trucks_year_idx    on trucks (year) where status = 'published';
create index trucks_seller_idx  on trucks (seller_id);
create index trucks_dealer_idx  on trucks (dealer_id);
create index trucks_title_trgm  on trucks using gin (title gin_trgm_ops);

create table truck_images (
  id         uuid primary key default gen_random_uuid(),
  truck_id   uuid not null references trucks(id) on delete cascade,
  path       text not null,
  sort_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index truck_images_truck_idx on truck_images(truck_id, sort_order);
create unique index truck_images_one_primary on truck_images(truck_id) where is_primary;

-- ----------------------------------------------------------------- parts
create table parts (
  id                  uuid primary key default gen_random_uuid(),
  seller_id           uuid not null references profiles(id) on delete cascade,
  dealer_id           uuid references dealers(id) on delete set null,
  slug                text not null unique,
  category_id         uuid not null references part_categories(id),
  title               text not null,
  brand               text,
  part_number         text,
  oem_number          text,
  condition           part_condition not null default 'used',
  part_type           part_type,
  compatible_brand_id uuid references truck_brands(id),
  compatible_models   text[],
  price               numeric(12,2) not null check (price >= 0),
  currency            currency_code not null default 'USD',
  negotiable          boolean not null default false,
  description         text,
  location_id         uuid not null references locations(id),
  phone               text not null,
  whatsapp            text,
  status              listing_status not null default 'draft',
  featured            boolean not null default false,
  quality_score       int not null default 0,
  views_count         int not null default 0,
  rejection_reason    text,
  reviewed_by         uuid references profiles(id),
  reviewed_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  published_at        timestamptz,
  sold_at             timestamptz
);
create index parts_browse_idx on parts (status, published_at desc);
create index parts_cat_idx    on parts (category_id) where status = 'published';
create index parts_loc_idx    on parts (location_id) where status = 'published';
create index parts_seller_idx on parts (seller_id);
create index parts_dealer_idx on parts (dealer_id);
create index parts_title_trgm on parts using gin (title gin_trgm_ops);
create index parts_number_idx on parts (part_number);
create index parts_oem_idx    on parts (oem_number);

create table part_images (
  id         uuid primary key default gen_random_uuid(),
  part_id    uuid not null references parts(id) on delete cascade,
  path       text not null,
  sort_order int not null default 0,
  is_primary boolean not null default false,
  created_at timestamptz not null default now()
);
create index part_images_part_idx on part_images(part_id, sort_order);
create unique index part_images_one_primary on part_images(part_id) where is_primary;

-- -------------------------------------------------------- user artefacts
create table favorites (
  user_id      uuid not null references profiles(id) on delete cascade,
  listing_kind listing_kind not null,
  listing_id   uuid not null,
  created_at   timestamptz not null default now(),
  primary key (user_id, listing_kind, listing_id)
);

create table saved_searches (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references profiles(id) on delete cascade,
  listing_kind listing_kind not null default 'truck',
  name         text not null,
  query        jsonb not null,
  notify       boolean not null default false,
  created_at   timestamptz not null default now()
);
create index saved_searches_user_idx on saved_searches(user_id);

create table truck_requests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) on delete set null,
  brand_id      uuid references truck_brands(id),
  model_text    text,
  year_from     int,
  year_to       int,
  max_price     numeric(12,2),
  currency      currency_code not null default 'USD',
  axle_configuration text,
  location_id   uuid references locations(id),
  notes         text,
  contact_phone text not null,
  status        report_status not null default 'open',
  created_at    timestamptz not null default now()
);

create table part_requests (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) on delete set null,
  brand_id      uuid references truck_brands(id),
  model_text    text,
  year          int,
  description   text not null,
  part_number   text,
  image_path    text,
  location_id   uuid references locations(id),
  contact_phone text not null,
  status        report_status not null default 'open',
  created_at    timestamptz not null default now()
);

create table reports (
  id           uuid primary key default gen_random_uuid(),
  reporter_id  uuid references profiles(id) on delete set null,
  listing_kind listing_kind not null,
  listing_id   uuid not null,
  reason       report_reason not null,
  details      text,
  status       report_status not null default 'open',
  reviewed_by  uuid references profiles(id),
  reviewed_at  timestamptz,
  resolution   text,
  created_at   timestamptz not null default now()
);
create index reports_status_idx on reports(status, created_at desc);

create table verifications (
  id            uuid primary key default gen_random_uuid(),
  profile_id    uuid not null references profiles(id) on delete cascade,
  dealer_id     uuid references dealers(id) on delete cascade,
  level         verification_level not null,
  status        verification_status not null default 'pending',
  document_path text,
  notes         text,
  requested_at  timestamptz not null default now(),
  reviewed_at   timestamptz,
  reviewed_by   uuid references profiles(id)
);
create index verifications_status_idx on verifications(status, requested_at desc);

create table contact_events (
  id           bigserial primary key,
  listing_kind listing_kind not null,
  listing_id   uuid not null,
  user_id      uuid references profiles(id) on delete set null,
  event_type   contact_event_type not null,
  created_at   timestamptz not null default now()
);
create index contact_events_listing_idx on contact_events(listing_kind, listing_id, event_type);
create index contact_events_time_idx on contact_events(created_at desc);

-- Zero-result searches: unmet buyer demand.
create table search_misses (
  id           bigserial primary key,
  listing_kind listing_kind not null,
  query        text,
  filters      jsonb,
  locale       text,
  created_at   timestamptz not null default now()
);

-- -------------------------------------------------------------- functions
create or replace function public.bump_views(kind listing_kind, listing uuid)
returns void language plpgsql security definer set search_path = public as $fn$
begin
  if kind = 'truck' then
    update trucks set views_count = views_count + 1 where trucks.id = listing;
  else
    update parts set views_count = views_count + 1 where parts.id = listing;
  end if;
end $fn$;

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $fn$
begin new.updated_at = now(); return new; end $fn$;

create trigger trucks_touch   before update on trucks   for each row execute function touch_updated_at();
create trigger parts_touch    before update on parts    for each row execute function touch_updated_at();
create trigger dealers_touch  before update on dealers  for each row execute function touch_updated_at();
create trigger profiles_touch before update on profiles for each row execute function touch_updated_at();

-- ------------------------------------------------------------------- RLS
alter table profiles        enable row level security;
alter table dealers         enable row level security;
alter table locations       enable row level security;
alter table truck_brands    enable row level security;
alter table truck_models    enable row level security;
alter table truck_types     enable row level security;
alter table part_categories enable row level security;
alter table trucks          enable row level security;
alter table truck_images    enable row level security;
alter table parts           enable row level security;
alter table part_images     enable row level security;
alter table favorites       enable row level security;
alter table saved_searches  enable row level security;
alter table truck_requests  enable row level security;
alter table part_requests   enable row level security;
alter table reports         enable row level security;
alter table verifications   enable row level security;
alter table contact_events  enable row level security;
alter table search_misses   enable row level security;

-- taxonomies: world-readable, admin-writable
create policy tax_read_loc   on locations       for select using (true);
create policy tax_read_brand on truck_brands    for select using (true);
create policy tax_read_model on truck_models    for select using (true);
create policy tax_read_type  on truck_types     for select using (true);
create policy tax_read_cat   on part_categories for select using (true);
create policy tax_w_loc   on locations       for all using (is_admin()) with check (is_admin());
create policy tax_w_brand on truck_brands    for all using (is_admin()) with check (is_admin());
create policy tax_w_model on truck_models    for all using (is_admin()) with check (is_admin());
create policy tax_w_type  on truck_types     for all using (is_admin()) with check (is_admin());
create policy tax_w_cat   on part_categories for all using (is_admin()) with check (is_admin());

-- profiles
create policy profiles_read_own   on profiles for select using (id = auth.uid() or is_admin());
create policy profiles_update_own on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_admin_all  on profiles for all using (is_admin()) with check (is_admin());

-- dealers
create policy dealers_read   on dealers for select using (active or owner_id = auth.uid() or is_admin());
create policy dealers_insert on dealers for insert with check (owner_id = auth.uid() and is_active());
create policy dealers_update on dealers for update using (owner_id = auth.uid() or is_admin())
  with check (owner_id = auth.uid() or is_admin());
create policy dealers_delete on dealers for delete using (is_admin());

-- trucks
create policy trucks_read_public on trucks for select
  using (status in ('published','sold') or seller_id = auth.uid() or is_admin());
create policy trucks_insert on trucks for insert
  with check (seller_id = auth.uid() and is_active()
              and (dealer_id is null or exists (select 1 from dealers d where d.id = dealer_id and d.owner_id = auth.uid())));
create policy trucks_update on trucks for update
  using (seller_id = auth.uid() or is_admin())
  with check (seller_id = auth.uid() or is_admin());
create policy trucks_delete on trucks for delete using (seller_id = auth.uid() or is_admin());

create policy truck_images_read on truck_images for select
  using (exists (select 1 from trucks t where t.id = truck_id
                 and (t.status in ('published','sold') or t.seller_id = auth.uid() or is_admin())));
create policy truck_images_write on truck_images for all
  using (exists (select 1 from trucks t where t.id = truck_id and (t.seller_id = auth.uid() or is_admin())))
  with check (exists (select 1 from trucks t where t.id = truck_id and (t.seller_id = auth.uid() or is_admin())));

-- parts
create policy parts_read_public on parts for select
  using (status in ('published','sold') or seller_id = auth.uid() or is_admin());
create policy parts_insert on parts for insert
  with check (seller_id = auth.uid() and is_active()
              and (dealer_id is null or exists (select 1 from dealers d where d.id = dealer_id and d.owner_id = auth.uid())));
create policy parts_update on parts for update
  using (seller_id = auth.uid() or is_admin())
  with check (seller_id = auth.uid() or is_admin());
create policy parts_delete on parts for delete using (seller_id = auth.uid() or is_admin());

create policy part_images_read on part_images for select
  using (exists (select 1 from parts p where p.id = part_id
                 and (p.status in ('published','sold') or p.seller_id = auth.uid() or is_admin())));
create policy part_images_write on part_images for all
  using (exists (select 1 from parts p where p.id = part_id and (p.seller_id = auth.uid() or is_admin())))
  with check (exists (select 1 from parts p where p.id = part_id and (p.seller_id = auth.uid() or is_admin())));

-- user-owned rows
create policy favorites_own on favorites      for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy saved_own     on saved_searches for all using (user_id = auth.uid()) with check (user_id = auth.uid());

create policy treq_insert on truck_requests for insert with check (user_id = auth.uid() or user_id is null);
create policy treq_read   on truck_requests for select using (user_id = auth.uid() or is_admin());
create policy treq_admin  on truck_requests for all using (is_admin()) with check (is_admin());
create policy preq_insert on part_requests  for insert with check (user_id = auth.uid() or user_id is null);
create policy preq_read   on part_requests  for select using (user_id = auth.uid() or is_admin());
create policy preq_admin  on part_requests  for all using (is_admin()) with check (is_admin());

create policy reports_insert on reports for insert with check (reporter_id = auth.uid());
create policy reports_read   on reports for select using (reporter_id = auth.uid() or is_admin());
create policy reports_admin  on reports for all using (is_admin()) with check (is_admin());

create policy verif_insert on verifications for insert with check (profile_id = auth.uid());
create policy verif_read   on verifications for select using (profile_id = auth.uid() or is_admin());
create policy verif_admin  on verifications for all using (is_admin()) with check (is_admin());

create policy events_insert on contact_events for insert with check (true);
create policy events_read   on contact_events for select using (is_admin());
create policy misses_insert on search_misses  for insert with check (true);
create policy misses_read   on search_misses  for select using (is_admin());

-- ---------------------------------------------------------------- storage
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listings','listings', true, 5242880,
        array['image/jpeg','image/png','image/webp','image/avif'])
on conflict (id) do nothing;

create policy "listing images are public"
  on storage.objects for select using (bucket_id = 'listings');
create policy "owner uploads listing images"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'listings' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owner updates listing images"
  on storage.objects for update to authenticated
  using (bucket_id = 'listings' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "owner deletes listing images"
  on storage.objects for delete to authenticated
  using (bucket_id = 'listings' and (storage.foldername(name))[1] = auth.uid()::text);
