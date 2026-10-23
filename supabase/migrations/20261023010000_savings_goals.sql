-- Savings goals: a target amount, how much is saved so far, and an optional deadline.

create table if not exists public.goals (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label      text not null check (char_length(btrim(label)) between 1 and 40),
  target     bigint not null check (target > 0),
  saved      bigint not null default 0 check (saved >= 0),
  color      text not null check (color ~ '^oklch\([0-9. ]{5,30}\)$'),
  deadline   date,
  created_at timestamptz not null default now()
);

create index if not exists goals_user_id_idx on public.goals (user_id);

alter table public.goals enable row level security;

drop policy if exists "goals: own rows" on public.goals;
create policy "goals: own rows" on public.goals
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.goals from anon;
grant select, insert, update, delete on public.goals to authenticated;
