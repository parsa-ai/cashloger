-- Cashlog schema: per-user categories and transactions, protected by RLS.

create type public.log_kind as enum ('cost', 'income');

-- ---------------------------------------------------------------------------
-- categories
-- ---------------------------------------------------------------------------
create table public.categories (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users (id) on delete cascade,
  kind       public.log_kind not null,
  label      text not null check (char_length(btrim(label)) between 1 and 40),
  color      text not null,
  created_at timestamptz not null default now(),
  unique (user_id, kind, label)
);

create index categories_user_id_idx on public.categories (user_id);

-- ---------------------------------------------------------------------------
-- transactions
-- ---------------------------------------------------------------------------
create table public.transactions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- deleting a category keeps its transactions, they just become uncategorized
  category_id uuid references public.categories (id) on delete set null,
  kind        public.log_kind not null,
  amount      bigint not null check (amount > 0),
  description text,
  occurred_at timestamptz not null default now(),
  created_at  timestamptz not null default now()
);

create index transactions_user_id_occurred_at_idx on public.transactions (user_id, occurred_at);
create index transactions_category_id_idx on public.transactions (category_id);

-- ---------------------------------------------------------------------------
-- RLS: every user only sees and changes their own rows
-- ---------------------------------------------------------------------------
alter table public.categories enable row level security;
alter table public.transactions enable row level security;

create policy "categories_select_own" on public.categories for select
  to authenticated using ((select auth.uid()) = user_id);
create policy "categories_insert_own" on public.categories for insert
  to authenticated with check ((select auth.uid()) = user_id);
create policy "categories_update_own" on public.categories for update
  to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "categories_delete_own" on public.categories for delete
  to authenticated using ((select auth.uid()) = user_id);

create policy "transactions_select_own" on public.transactions for select
  to authenticated using ((select auth.uid()) = user_id);
create policy "transactions_insert_own" on public.transactions for insert
  to authenticated with check (
    (select auth.uid()) = user_id
    and (
      category_id is null
      or exists (
        select 1 from public.categories c
        where c.id = category_id and c.user_id = (select auth.uid()) and c.kind = transactions.kind
      )
    )
  );
create policy "transactions_update_own" on public.transactions for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (
      category_id is null
      or exists (
        select 1 from public.categories c
        where c.id = category_id and c.user_id = (select auth.uid()) and c.kind = transactions.kind
      )
    )
  );
create policy "transactions_delete_own" on public.transactions for delete
  to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.transactions to authenticated;
revoke all on public.categories from anon;
revoke all on public.transactions from anon;

-- ---------------------------------------------------------------------------
-- default categories for every new user
-- ---------------------------------------------------------------------------
create schema if not exists private;

create or replace function private.seed_default_categories(target_user uuid)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.categories (user_id, kind, label, color)
  values
    (target_user, 'cost', 'تفریح',       'var(--chart-2)'),
    (target_user, 'cost', 'قشنگم',       'var(--chart-9)'),
    (target_user, 'cost', 'پوشاک',       'var(--chart-4)'),
    (target_user, 'cost', 'خوراکی',      'var(--chart-5)'),
    (target_user, 'cost', 'پس انداز',    'var(--chart-6)'),
    (target_user, 'cost', 'خونه',        'var(--chart-7)'),
    (target_user, 'cost', 'ماشین',       'var(--chart-8)'),
    (target_user, 'cost', 'حمل و نقل',   'var(--chart-3)'),
    (target_user, 'cost', 'سلامتی',      'var(--chart-10)'),
    (target_user, 'cost', 'سایر',        'var(--chart-1)'),
    (target_user, 'income', 'حقوق',          'var(--chart-1)'),
    (target_user, 'income', 'پاداش',         'var(--chart-2)'),
    (target_user, 'income', 'خانواده',       'var(--chart-3)'),
    (target_user, 'income', 'پارتنر',        'var(--chart-4)'),
    (target_user, 'income', 'فریلنسری',      'var(--chart-5)'),
    (target_user, 'income', 'فروش',          'var(--chart-6)'),
    (target_user, 'income', 'سرمایه‌گذاری',  'var(--chart-7)'),
    (target_user, 'income', 'اجاره',         'var(--chart-8)'),
    (target_user, 'income', 'وام',           'var(--chart-9)'),
    (target_user, 'income', 'یارانه',        'var(--chart-10)')
  on conflict (user_id, kind, label) do nothing;
$$;

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform private.seed_default_categories(new.id);
  return new;
end;
$$;

revoke execute on function private.seed_default_categories(uuid) from public, anon, authenticated;
revoke execute on function private.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created_seed_categories
  after insert on auth.users
  for each row execute function private.handle_new_user();

-- users that signed up before this migration get the defaults too
select private.seed_default_categories(id) from auth.users;
