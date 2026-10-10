-- Preserve listings and public reads. Restrictive policies also constrain any
-- additional permissive policies that may already exist in production.
begin;

do $migration$
declare
  target text;
begin
  foreach target in array array['trucks', 'parts', 'truck_images', 'part_images'] loop
    execute format('alter table public.%I enable row level security', target);
    execute format('drop policy if exists admin_only_insert on public.%I', target);
    execute format('drop policy if exists admin_only_update on public.%I', target);
    execute format('drop policy if exists admin_only_delete on public.%I', target);
    execute format('create policy admin_only_insert on public.%I as restrictive for insert to public with check (public.is_admin() and public.is_active())', target);
    execute format('create policy admin_only_update on public.%I as restrictive for update to public using (public.is_admin() and public.is_active()) with check (public.is_admin() and public.is_active())', target);
    execute format('create policy admin_only_delete on public.%I as restrictive for delete to public using (public.is_admin() and public.is_active())', target);
    -- A permissive policy is still needed for an admin editing another owner's row.
    execute format('drop policy if exists admin_listing_write on public.%I', target);
    execute format('create policy admin_listing_write on public.%I for all to authenticated using (public.is_admin() and public.is_active()) with check (public.is_admin() and public.is_active())', target);
  end loop;
end $migration$;

drop policy if exists listings_admin_insert on storage.objects;
drop policy if exists listings_admin_update on storage.objects;
drop policy if exists listings_admin_delete on storage.objects;
drop policy if exists listings_admin_manage on storage.objects;
create policy listings_admin_insert on storage.objects as restrictive for insert to public
  with check (bucket_id <> 'listings' or (public.is_admin() and public.is_active()));
create policy listings_admin_update on storage.objects as restrictive for update to public
  using (bucket_id <> 'listings' or (public.is_admin() and public.is_active()))
  with check (bucket_id <> 'listings' or (public.is_admin() and public.is_active()));
create policy listings_admin_delete on storage.objects as restrictive for delete to public
  using (bucket_id <> 'listings' or (public.is_admin() and public.is_active()));
create policy listings_admin_manage on storage.objects for all to authenticated
  using (bucket_id = 'listings' and public.is_admin() and public.is_active())
  with check (bucket_id = 'listings' and public.is_admin() and public.is_active());

commit;
