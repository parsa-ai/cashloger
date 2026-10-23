-- Savings goal deposits/withdrawals are real transactions linked to the goal, so they move the balance
-- and show up in the transaction list. A deposit is kind 'cost' (money leaves the balance), a withdrawal
-- is kind 'income'. goals.saved stays as the amount saved before tracking started.
-- Deleting a goal deletes its transactions: the money goes back to the balance.

alter table public.transactions
  add column if not exists goal_id uuid references public.goals (id) on delete cascade;

create index if not exists transactions_goal_id_idx on public.transactions (goal_id);

alter table public.transactions drop constraint if exists transactions_goal_or_category_check;
alter table public.transactions
  add constraint transactions_goal_or_category_check check (goal_id is null or category_id is null);

drop policy if exists "transactions_insert_own" on public.transactions;
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
    and (
      goal_id is null
      or exists (select 1 from public.goals g where g.id = goal_id and g.user_id = (select auth.uid()))
    )
  );

drop policy if exists "transactions_update_own" on public.transactions;
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
    and (
      goal_id is null
      or exists (select 1 from public.goals g where g.id = goal_id and g.user_id = (select auth.uid()))
    )
  );
