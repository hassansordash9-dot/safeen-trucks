-- Safin Trucks — column-level guards.
--
-- Row level security decides WHICH rows a user may touch, not WHICH columns.
-- Without these triggers a seller could call the REST API directly and set
-- featured = true, skip moderation, self-verify a dealership or make themselves
-- an admin. The server actions already refuse to do that; this closes the
-- direct-API path as well.
--
-- The trigger functions are deliberately NOT security definer: they must see the
-- caller's role, and they only ever rewrite NEW.

create or replace function public.is_privileged()
returns boolean language sql stable as $fn$
  select current_user in ('service_role', 'postgres', 'supabase_admin');
$fn$;

-- ------------------------------------------------------------------ trucks
create or replace function public.protect_truck_fields()
returns trigger language plpgsql as $fn$
begin
  if is_privileged() or is_admin() then
    return new;
  end if;

  new.featured         := old.featured;
  new.verified_listing := old.verified_listing;
  new.views_count      := old.views_count;
  new.reviewed_by      := old.reviewed_by;
  new.reviewed_at      := old.reviewed_at;
  new.rejection_reason := old.rejection_reason;
  new.seller_id        := old.seller_id;
  new.slug             := old.slug;
  new.published_at     := old.published_at;

  if new.status is distinct from old.status then
    if not (
      (old.status = 'draft'        and new.status in ('draft', 'pending'))
      or (old.status = 'pending'   and new.status in ('draft', 'pending'))
      or (old.status = 'rejected'  and new.status in ('draft', 'pending'))
      or (old.status = 'published' and new.status in ('paused', 'sold', 'pending'))
      or (old.status = 'paused'    and new.status in ('published', 'sold', 'draft'))
      or (old.status = 'sold'      and new.status in ('published', 'paused'))
      or (old.status = 'expired'   and new.status in ('draft', 'pending'))
    ) then
      raise exception 'Listing status cannot go from % to %', old.status, new.status;
    end if;
  end if;

  -- Going live is only possible for something a moderator already approved.
  if new.status = 'published' and old.published_at is null then
    raise exception 'A listing must be approved before it can be published';
  end if;

  return new;
end $fn$;

create trigger trucks_protect_fields
  before update on trucks
  for each row execute function protect_truck_fields();

-- ------------------------------------------------------------------- parts
create or replace function public.protect_part_fields()
returns trigger language plpgsql as $fn$
begin
  if is_privileged() or is_admin() then
    return new;
  end if;

  new.featured         := old.featured;
  new.views_count      := old.views_count;
  new.reviewed_by      := old.reviewed_by;
  new.reviewed_at      := old.reviewed_at;
  new.rejection_reason := old.rejection_reason;
  new.seller_id        := old.seller_id;
  new.slug             := old.slug;
  new.published_at     := old.published_at;

  if new.status is distinct from old.status then
    if not (
      (old.status = 'draft'        and new.status in ('draft', 'pending'))
      or (old.status = 'pending'   and new.status in ('draft', 'pending'))
      or (old.status = 'rejected'  and new.status in ('draft', 'pending'))
      or (old.status = 'published' and new.status in ('paused', 'sold', 'pending'))
      or (old.status = 'paused'    and new.status in ('published', 'sold', 'draft'))
      or (old.status = 'sold'      and new.status in ('published', 'paused'))
      or (old.status = 'expired'   and new.status in ('draft', 'pending'))
    ) then
      raise exception 'Listing status cannot go from % to %', old.status, new.status;
    end if;
  end if;

  if new.status = 'published' and old.published_at is null then
    raise exception 'A listing must be approved before it can be published';
  end if;

  return new;
end $fn$;

create trigger parts_protect_fields
  before update on parts
  for each row execute function protect_part_fields();

-- Whoever inserts, a listing starts unfeatured, unapproved and unpublished.
create or replace function public.protect_listing_insert()
returns trigger language plpgsql as $fn$
begin
  if is_privileged() or is_admin() then
    return new;
  end if;

  new.featured         := false;
  new.views_count      := 0;
  new.reviewed_by      := null;
  new.reviewed_at      := null;
  new.rejection_reason := null;
  new.published_at     := null;
  new.sold_at          := null;

  if TG_TABLE_NAME = 'trucks' then
    new.verified_listing := false;
  end if;

  if new.status not in ('draft', 'pending') then
    raise exception 'New listings must start as draft or pending';
  end if;

  return new;
end $fn$;

create trigger trucks_protect_insert
  before insert on trucks
  for each row execute function protect_listing_insert();

create trigger parts_protect_insert
  before insert on parts
  for each row execute function protect_listing_insert();

-- ---------------------------------------------------------------- profiles
create or replace function public.protect_profile_fields()
returns trigger language plpgsql as $fn$
begin
  if is_privileged() or is_admin() then
    return new;
  end if;

  new.status     := old.status;
  new.admin_note := old.admin_note;

  -- A user may turn themselves into a dealer, and nothing else.
  if new.role is distinct from old.role
     and not (old.role = 'user' and new.role = 'dealer') then
    new.role := old.role;
  end if;

  return new;
end $fn$;

create trigger profiles_protect_fields
  before update on profiles
  for each row execute function protect_profile_fields();

-- ----------------------------------------------------------------- dealers
create or replace function public.protect_dealer_fields()
returns trigger language plpgsql as $fn$
begin
  if is_privileged() or is_admin() then
    return new;
  end if;

  if TG_OP = 'INSERT' then
    new.verified := false;
    new.active   := true;
    return new;
  end if;

  new.verified := old.verified;
  new.owner_id := old.owner_id;
  new.slug     := old.slug;
  return new;
end $fn$;

create trigger dealers_protect_fields
  before insert or update on dealers
  for each row execute function protect_dealer_fields();

-- ----------------------------------------------- verifications and reports
create or replace function public.protect_verification_insert()
returns trigger language plpgsql as $fn$
begin
  if is_privileged() or is_admin() then
    return new;
  end if;

  new.status      := 'pending'::verification_status;
  new.reviewed_at := null;
  new.reviewed_by := null;
  return new;
end $fn$;

create trigger verifications_protect_insert
  before insert on verifications
  for each row execute function protect_verification_insert();

create or replace function public.protect_report_insert()
returns trigger language plpgsql as $fn$
begin
  if is_privileged() or is_admin() then
    return new;
  end if;

  new.status      := 'open'::report_status;
  new.reviewed_at := null;
  new.reviewed_by := null;
  new.resolution  := null;
  return new;
end $fn$;

create trigger reports_protect_insert
  before insert on reports
  for each row execute function protect_report_insert();
