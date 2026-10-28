-- Permanent assessment attempt history for CareerX.
--
-- SAFE TO APPLY TO AN EXISTING SUPABASE DATABASE.
-- * Nothing is dropped, truncated or overwritten. public.assessment_results is left
--   exactly as it is; the new submissions keep writing to it so that the existing
--   Decision Tree / K-Means / Apriori training loaders keep working untouched.
-- * public.assessment_attempts is append-only: students may insert and read their
--   own rows, but row level security grants no UPDATE or DELETE at all, so a saved
--   attempt can never be overwritten or removed by the application.
-- * Existing assessment_results rows are copied into assessment_attempts once, in
--   attempt order, so the previous history is preserved and becomes permanent.
-- * Re-running the whole file is safe: every statement is idempotent and the
--   backfill only inserts rows whose source result has not been linked yet.
--
-- Paste this entire file into the Supabase SQL Editor and run it once.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Table
-- ---------------------------------------------------------------------------
create table if not exists public.assessment_attempts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  attempt_number integer not null,
  assessment_type text not null default 'career-guidance-v1',
  assessment_version text not null default 'career-guidance-v1',
  status text not null default 'completed',
  question_count integer,
  answered_count integer,
  started_at timestamptz,
  submitted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  top_score numeric,
  answers jsonb not null default '{}'::jsonb,
  category_scores jsonb not null default '{}'::jsonb,
  profile_snapshot jsonb not null default '{}'::jsonb,
  knn_result jsonb,
  decision_tree_result jsonb,
  kmeans_result jsonb,
  apriori_result jsonb,
  career_candidates jsonb not null default '[]'::jsonb,
  match_results jsonb not null default '[]'::jsonb,
  match_ranking jsonb not null default '[]'::jsonb,
  explanations jsonb not null default '[]'::jsonb,
  source_result_id uuid,
  result_data jsonb not null default '{}'::jsonb
);

-- Column-level guards so a half-created table from an interrupted run is repaired.
alter table public.assessment_attempts add column if not exists attempt_number integer;
alter table public.assessment_attempts add column if not exists assessment_type text not null default 'career-guidance-v1';
alter table public.assessment_attempts add column if not exists assessment_version text not null default 'career-guidance-v1';
alter table public.assessment_attempts add column if not exists status text not null default 'completed';
alter table public.assessment_attempts add column if not exists question_count integer;
alter table public.assessment_attempts add column if not exists answered_count integer;
alter table public.assessment_attempts add column if not exists started_at timestamptz;
alter table public.assessment_attempts add column if not exists submitted_at timestamptz not null default now();
alter table public.assessment_attempts add column if not exists created_at timestamptz not null default now();
alter table public.assessment_attempts add column if not exists top_score numeric;
alter table public.assessment_attempts add column if not exists answers jsonb not null default '{}'::jsonb;
alter table public.assessment_attempts add column if not exists category_scores jsonb not null default '{}'::jsonb;
alter table public.assessment_attempts add column if not exists profile_snapshot jsonb not null default '{}'::jsonb;
alter table public.assessment_attempts add column if not exists knn_result jsonb;
alter table public.assessment_attempts add column if not exists decision_tree_result jsonb;
alter table public.assessment_attempts add column if not exists kmeans_result jsonb;
alter table public.assessment_attempts add column if not exists apriori_result jsonb;
alter table public.assessment_attempts add column if not exists career_candidates jsonb not null default '[]'::jsonb;
alter table public.assessment_attempts add column if not exists match_results jsonb not null default '[]'::jsonb;
alter table public.assessment_attempts add column if not exists match_ranking jsonb not null default '[]'::jsonb;
alter table public.assessment_attempts add column if not exists explanations jsonb not null default '[]'::jsonb;
alter table public.assessment_attempts add column if not exists source_result_id uuid;
alter table public.assessment_attempts add column if not exists result_data jsonb not null default '{}'::jsonb;

alter table public.assessment_attempts alter column attempt_number set not null;

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create unique index if not exists assessment_attempts_user_attempt_number_idx
  on public.assessment_attempts (user_id, attempt_number);

create index if not exists assessment_attempts_user_submitted_idx
  on public.assessment_attempts (user_id, submitted_at desc);

create index if not exists assessment_attempts_user_version_submitted_idx
  on public.assessment_attempts (user_id, assessment_version, submitted_at desc);

create index if not exists assessment_attempts_answers_gin_idx
  on public.assessment_attempts using gin (answers jsonb_path_ops);

create unique index if not exists assessment_attempts_source_result_idx
  on public.assessment_attempts (source_result_id)
  where source_result_id is not null;

-- ---------------------------------------------------------------------------
-- Row level security: a student may only read and create their own attempts.
-- No UPDATE and no DELETE policy is created, and the privileges below are
-- revoked, so an attempt is permanent once submitted.
-- ---------------------------------------------------------------------------
alter table public.assessment_attempts enable row level security;

drop policy if exists "Users can read own assessment_attempts" on public.assessment_attempts;
create policy "Users can read own assessment_attempts"
on public.assessment_attempts
for select
using (auth.uid() = user_id);

drop policy if exists "Users can create own assessment_attempts" on public.assessment_attempts;
create policy "Users can create own assessment_attempts"
on public.assessment_attempts
for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own assessment_attempts" on public.assessment_attempts;
drop policy if exists "Users can manage own assessment_attempts" on public.assessment_attempts;
drop policy if exists "Users can delete own assessment_attempts" on public.assessment_attempts;

revoke update, delete, truncate on table public.assessment_attempts from anon, authenticated;
revoke all on table public.assessment_attempts from anon;
grant select, insert on table public.assessment_attempts to authenticated;

-- ---------------------------------------------------------------------------
-- Backfill: adopt every existing assessment_results row as a permanent attempt.
-- public.assessment_results is not read from, moved or deleted afterwards.
-- ---------------------------------------------------------------------------
insert into public.assessment_attempts (
  user_id,
  attempt_number,
  assessment_type,
  assessment_version,
  status,
  question_count,
  answered_count,
  started_at,
  submitted_at,
  created_at,
  top_score,
  answers,
  category_scores,
  profile_snapshot,
  knn_result,
  decision_tree_result,
  kmeans_result,
  apriori_result,
  career_candidates,
  match_results,
  match_ranking,
  explanations,
  source_result_id,
  result_data
)
select
  source.user_id,
  (select coalesce(max(existing.attempt_number), 0)
     from public.assessment_attempts existing
    where existing.user_id = source.user_id)
    + row_number() over (
        partition by source.user_id
        order by source.completed_at asc, source.id asc
      )::integer,
  source.assessment_type,
  source.assessment_type,
  'completed',
  null,
  case when jsonb_typeof(source.result_data -> 'answers') = 'object'
       then (select count(*)::integer from jsonb_object_keys(source.result_data -> 'answers'))
       else null end,
  null,
  source.completed_at,
  source.completed_at,
  source.score,
  coalesce(source.result_data -> 'answers', '{}'::jsonb),
  coalesce(source.result_data -> 'categoryScores', '{}'::jsonb),
  '{}'::jsonb,
  source.result_data -> 'knn',
  null,
  null,
  null,
  '[]'::jsonb,
  coalesce(source.result_data -> 'recommendations', '[]'::jsonb),
  coalesce(source.result_data -> 'recommendations', '[]'::jsonb),
  '[]'::jsonb,
  source.id,
  coalesce(source.result_data, '{}'::jsonb)
from public.assessment_results source
where not exists (
  select 1 from public.assessment_attempts adopted where adopted.source_result_id = source.id
);
