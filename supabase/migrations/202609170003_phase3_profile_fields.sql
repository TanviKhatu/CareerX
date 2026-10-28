-- Phase 3 profile fields. Existing profile columns and RLS remain unchanged.
alter table public.profiles add column if not exists date_of_birth date;
alter table public.profiles add column if not exists gender text;
alter table public.profiles add column if not exists school_college text;
alter table public.profiles add column if not exists academic_performance text;
alter table public.profiles add column if not exists preferred_work_environment text;
alter table public.profiles add column if not exists work_style text;
alter table public.profiles add column if not exists preferred_industry text;
alter table public.profiles add column if not exists higher_education_preference text;
alter table public.profiles add column if not exists interests jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists skills jsonb not null default '[]'::jsonb;
alter table public.profiles add column if not exists career_interests jsonb not null default '[]'::jsonb;
