create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(), user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text not null default '', email text not null default '', phone text, education_level text, stream text,
  date_of_birth date, gender text, city text, state text, country text, profile_image text,
  email_verified boolean not null default false, phone_verified boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.education (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  institution text not null, degree text, stream text, specialization text, start_year int, end_year int, percentage_or_cgpa text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.interests (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  interest_name text not null, interest_level int default 1 check (interest_level between 1 and 5), created_at timestamptz not null default now()
);
create table if not exists public.skills (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  skill_name text not null, skill_level int default 1 check (skill_level between 1 and 5), created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.career_goals (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  career_name text not null, goal_type text, target_year int, priority int default 1, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.assessment_results (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  assessment_type text not null, score numeric, result_data jsonb not null default '{}'::jsonb, completed_at timestamptz not null default now()
);
create table if not exists public.progress (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  item_type text not null, item_name text not null, status text not null default 'not_started', progress_percentage int not null default 0 check (progress_percentage between 0 and 100), updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;

alter table public.profiles enable row level security;
alter table public.education enable row level security;
alter table public.interests enable row level security;
alter table public.skills enable row level security;
alter table public.career_goals enable row level security;
alter table public.assessment_results enable row level security;
alter table public.progress enable row level security;

do $$ declare table_name text; begin foreach table_name in array array['profiles','education','interests','skills','career_goals','assessment_results','progress'] loop execute format('drop policy if exists "Users can manage own %s" on public.%s', table_name, table_name); execute format('create policy "Users can manage own %s" on public.%s for all using (auth.uid() = user_id) with check (auth.uid() = user_id)', table_name, table_name); end loop; end $$;
