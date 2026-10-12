-- Apply after 0005. No records are deleted and RLS remains enabled.
begin;

-- Roles come only from the protected profile and a confirmed Auth identity.
create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $fn$
  select exists (
    select 1 from public.profiles p join auth.users u on u.id = p.id
    where p.id = auth.uid() and p.role = 'admin'
      and p.status in ('active', 'warned') and u.email_confirmed_at is not null
      and u.deleted_at is null and (u.banned_until is null or u.banned_until <= now())
  );
$fn$;

-- Even an application admin cannot grant roles through the public API.
create or replace function public.protect_profile_fields()
returns trigger language plpgsql as $fn$
begin
  if public.is_privileged() then return new; end if;
  new.role := old.role;
  if not public.is_admin() then
    new.status := old.status;
    new.admin_note := old.admin_note;
  end if;
  return new;
end $fn$;

-- Public reads are restricted even if another permissive policy is installed.
do $migration$
declare target text;
begin
  foreach target in array array['trucks', 'parts'] loop
    execute format('drop policy if exists listing_visibility on public.%I', target);
    execute format('create policy listing_visibility on public.%I as restrictive for select to public using (status in (''published'', ''sold'') or public.is_admin())', target);
  end loop;
end $migration$;

drop policy if exists image_visibility on public.truck_images;
create policy image_visibility on public.truck_images as restrictive for select to public
  using (exists (select 1 from public.trucks t where t.id = truck_id
    and (t.status in ('published','sold') or public.is_admin())));
drop policy if exists image_visibility on public.part_images;
create policy image_visibility on public.part_images as restrictive for select to public
  using (exists (select 1 from public.parts p where p.id = part_id
    and (p.status in ('published','sold') or public.is_admin())));

-- Private bucket prevents direct public URLs from bypassing Storage RLS.
update storage.buckets set public = false where id = 'listings';
drop policy if exists "listing images are public" on storage.objects;
drop policy if exists listing_photo_visibility on storage.objects;
create policy listing_photo_visibility on storage.objects as restrictive for select to public
using (bucket_id <> 'listings' or public.is_admin() or
  exists (select 1 from public.truck_images i join public.trucks t on t.id = i.truck_id
    where i.path = name and t.status in ('published','sold')) or
  exists (select 1 from public.part_images i join public.parts p on p.id = i.part_id
    where i.path = name and p.status in ('published','sold')));
create policy "listing images are public" on storage.objects for select to public
using (bucket_id = 'listings' and (
  public.is_admin() or
  exists (select 1 from public.truck_images i join public.trucks t on t.id = i.truck_id
    where i.path = name and t.status in ('published','sold')) or
  exists (select 1 from public.part_images i join public.parts p on p.id = i.part_id
    where i.path = name and p.status in ('published','sold'))));

-- Direct API publishing and server actions share publication timestamps.
create or replace function public.stamp_listing_publication()
returns trigger language plpgsql as $fn$
begin
  if new.status = 'published' and (public.is_admin() or public.is_privileged()) then
    new.published_at := coalesce(new.published_at, now());
    new.sold_at := null;
  end if;
  return new;
end $fn$;
create trigger trucks_stamp_publication before insert or update on public.trucks
  for each row execute function public.stamp_listing_publication();
create trigger parts_stamp_publication before insert or update on public.parts
  for each row execute function public.stamp_listing_publication();

commit;
