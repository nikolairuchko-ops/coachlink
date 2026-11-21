create table if not exists public.coach_exercises (
  id uuid primary key default gen_random_uuid(),
  coach_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(trim(name)) between 1 and 140),
  category text not null default 'Общее' check (char_length(category) <= 80),
  description text not null default '',
  sets_count integer not null default 3 check (sets_count between 1 and 50),
  reps_count integer not null default 10 check (reps_count between 1 and 10000),
  rest_seconds integer not null default 60 check (rest_seconds between 0 and 3600),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.coach_exercises enable row level security;
revoke all on public.coach_exercises from anon, public;
grant select, insert, update, delete on public.coach_exercises to authenticated;
drop policy if exists coach_exercises_select_own on public.coach_exercises;
create policy coach_exercises_select_own on public.coach_exercises
for select to authenticated
using (coach_id = (select auth.uid()));
drop policy if exists coach_exercises_insert_own on public.coach_exercises;
create policy coach_exercises_insert_own on public.coach_exercises
for insert to authenticated
with check (
  coach_id = (select auth.uid())
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('coach','admin'))
);
drop policy if exists coach_exercises_update_own on public.coach_exercises;
create policy coach_exercises_update_own on public.coach_exercises
for update to authenticated
using (coach_id = (select auth.uid()))
with check (
  coach_id = (select auth.uid())
  and exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('coach','admin'))
);
drop policy if exists coach_exercises_delete_own on public.coach_exercises;
create policy coach_exercises_delete_own on public.coach_exercises
for delete to authenticated
using (coach_id = (select auth.uid()));
create index if not exists coach_exercises_coach_category_idx on public.coach_exercises(coach_id, category, name);
