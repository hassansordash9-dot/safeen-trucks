-- Email signup stores the contact phone in metadata, not auth.users.phone.
begin;
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  insert into public.profiles (id, full_name, phone, whatsapp)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    coalesce(nullif(new.phone, ''), nullif(new.raw_user_meta_data->>'phone', '')),
    nullif(new.raw_user_meta_data->>'whatsapp', '')
  )
  on conflict (id) do nothing;
  return new;
end $fn$;

-- Fill missing contact phones; preserve values users have already saved.
update public.profiles p
set phone = coalesce(nullif(u.phone, ''), nullif(u.raw_user_meta_data->>'phone', ''))
from auth.users u
where p.id = u.id and coalesce(p.phone, '') = ''
  and coalesce(nullif(u.phone, ''), nullif(u.raw_user_meta_data->>'phone', '')) is not null;
commit;
