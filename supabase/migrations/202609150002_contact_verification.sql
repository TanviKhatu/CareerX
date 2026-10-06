alter table public.profiles add column if not exists email_verified boolean not null default false;
alter table public.profiles add column if not exists phone_verified boolean not null default false;

create or replace function public.sync_profile_verification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare auth_record record;
begin
  select email_confirmed_at, phone_confirmed_at, email, phone
    into auth_record
    from auth.users
   where id = new.user_id;

  if tg_op = 'INSERT' and (auth_record.email_confirmed_at is null or auth_record.phone_confirmed_at is null) then
    raise exception 'Contact verification is required before profile activation';
  end if;

  new.email_verified := auth_record.email_confirmed_at is not null;
  new.phone_verified := auth_record.phone_confirmed_at is not null;
  if new.email is null or new.email = '' then new.email := auth_record.email; end if;
  if new.phone is null or new.phone = '' then new.phone := auth_record.phone; end if;
  return new;
end;
$$;

drop trigger if exists sync_profile_verification on public.profiles;
create trigger sync_profile_verification
before insert or update on public.profiles
for each row execute procedure public.sync_profile_verification();

create or replace function public.activate_verified_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.email_confirmed_at is not null and new.phone_confirmed_at is not null then
    insert into public.profiles (user_id, full_name, email, phone, education_level, stream, email_verified, phone_verified)
    values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email, new.phone, new.raw_user_meta_data->>'education_level', new.raw_user_meta_data->>'stream', true, true)
    on conflict (user_id) do update set email_verified = true, phone_verified = true, email = excluded.email, phone = excluded.phone, updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
drop trigger if exists on_auth_user_contact_verified on auth.users;
create trigger on_auth_user_contact_verified
after update of email_confirmed_at, phone_confirmed_at on auth.users
for each row execute procedure public.activate_verified_profile();

insert into public.profiles (user_id, full_name, email, phone, education_level, stream, email_verified, phone_verified)
select id, coalesce(raw_user_meta_data->>'full_name', ''), email, phone, raw_user_meta_data->>'education_level', raw_user_meta_data->>'stream', true, true
from auth.users
where email_confirmed_at is not null and phone_confirmed_at is not null
on conflict (user_id) do update set email_verified = true, phone_verified = true, updated_at = now();