-- Phase 3 assessment repair for Supabase projects where the Phase 2 schema was not applied.
-- Reuses public.assessment_results; no public access is granted.

create extension if not exists "pgcrypto";

create table if not exists public.assessment_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_type text not null,
  score numeric,
  result_data jsonb not null default '{}'::jsonb,
  completed_at timestamptz not null default now()
);

alter table public.assessment_results enable row level security;

drop policy if exists "Users can manage own assessment_results" on public.assessment_results;
create policy "Users can manage own assessment_results"
on public.assessment_results
for all
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create index if not exists assessment_results_user_completed_idx
on public.assessment_results (user_id, completed_at desc);
