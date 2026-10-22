-- Optional monthly budget per cost category (in tomans). The same limit applies to every month.

alter table public.categories
  add column if not exists budget bigint;

alter table public.categories drop constraint if exists categories_budget_check;
alter table public.categories
  add constraint categories_budget_check check (budget is null or (budget > 0 and kind = 'cost'));
