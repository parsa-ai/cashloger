-- Usernames: unique, lowercase a-z 0-9 _ (3–20 chars). Users can sign in with
-- their username or their email; the server resolves a username to an email
-- with the service role, so emails are never readable through the API.

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,20}$'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles: read own" on public.profiles;
create policy "profiles: read own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);

drop policy if exists "profiles: insert own" on public.profiles;
create policy "profiles: insert own" on public.profiles
  for insert to authenticated with check ((select auth.uid()) = id);

drop policy if exists "profiles: update own" on public.profiles;
create policy "profiles: update own" on public.profiles
  for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

revoke all on public.profiles from anon;
grant select, insert, update on public.profiles to authenticated;

-- Checking availability during sign-up only reveals whether a username exists,
-- never who owns it.
create or replace function public.username_available(candidate text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select candidate ~ '^[a-z0-9_]{3,20}$'
    and not exists (select 1 from public.profiles p where p.username = candidate);
$$;

revoke execute on function public.username_available(text) from public;
grant execute on function public.username_available(text) to anon, authenticated;

-- The username chosen at sign-up arrives in the user's metadata. If it was
-- taken in the meantime the account is still created, just without a username,
-- and the app asks for one later.
create or replace function private.create_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  wanted text := lower(new.raw_user_meta_data ->> 'username');
begin
  if wanted ~ '^[a-z0-9_]{3,20}$' then
    insert into public.profiles (id, username) values (new.id, wanted)
    on conflict do nothing;
  end if;
  return new;
end;
$$;

revoke execute on function private.create_profile() from public, anon, authenticated;

drop trigger if exists on_auth_user_created_profile on auth.users;
create trigger on_auth_user_created_profile
  after insert on auth.users
  for each row execute function private.create_profile();
