-- Repair migration for projects where the Phase 2 profiles migration was not applied.
-- This reuses public.profiles and does not weaken RLS.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text not null default '',
  phone text,
  education_level text,
  stream text,
  date_of_birth date,
  gender text,
  city text,
  state text,
  country text,
  profile_image text,
  email_verified boolean not null default false,
  phone_verified boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles add column if not exists email_verified boolean not null default false;
alter table public.profiles add column if not exists phone_verified boolean not null default false;
alter table public.profiles enable row level security;

drop policy if exists "Users can manage own profiles" on public.profiles;
create policy "Users can manage own profiles"
on public.profiles
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

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

  if auth_record.email_confirmed_at is null then
    raise exception 'Email verification is required before profile activation';
  end if;

  new.email_verified := true;
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
  if new.email_confirmed_at is not null then
    insert into public.profiles (user_id, full_name, email, phone, education_level, stream, email_verified, phone_verified)
    values (new.id, coalesce(new.raw_user_meta_data->>'full_name', ''), new.email, new.phone, new.raw_user_meta_data->>'education_level', new.raw_user_meta_data->>'stream', true, new.phone_confirmed_at is not null)
    on conflict (user_id) do update set email_verified = true, phone_verified = excluded.phone_verified, email = excluded.email, phone = excluded.phone, updated_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists on_auth_user_contact_verified on auth.users;
create trigger on_auth_user_contact_verified
after update of email_confirmed_at, phone_confirmed_at on auth.users
for each row execute procedure public.activate_verified_profile();
