-- Daily reminders sent as Web Push notifications at times the user picks.
-- A pg_cron job pings the app every 5 minutes; the app finds the reminders
-- that are due and sends them to every device the user subscribed.

-- ---------------------------------------------------------------------------
-- reminder_settings: one row per user
-- ---------------------------------------------------------------------------
create table if not exists public.reminder_settings (
  user_id      uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  -- minutes after local midnight (e.g. 21:00 → 1260)
  times        smallint[] not null default '{}'
               check (array_length(times, 1) is null or array_length(times, 1) <= 4)
               check (0 <= all (times) and 1439 >= all (times)),
  -- IANA name from the user's device, e.g. Asia/Tehran
  timezone     text not null default 'Asia/Tehran',
  last_sent_at timestamptz,
  updated_at   timestamptz not null default now()
);

alter table public.reminder_settings enable row level security;

drop policy if exists "reminder_settings: own rows" on public.reminder_settings;
create policy "reminder_settings: own rows" on public.reminder_settings
  for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

revoke all on public.reminder_settings from anon;
grant select, insert, update, delete on public.reminder_settings to authenticated;

-- ---------------------------------------------------------------------------
-- push_subscriptions: one row per device/browser. Written only by the app's
-- server (service role), because a device can move from one account to another.
-- ---------------------------------------------------------------------------
create table if not exists public.push_subscriptions (
  endpoint   text primary key,
  user_id    uuid not null references auth.users (id) on delete cascade,
  p256dh     text not null,
  auth       text not null,
  created_at timestamptz not null default now()
);

create index if not exists push_subscriptions_user_id_idx on public.push_subscriptions (user_id);

alter table public.push_subscriptions enable row level security;
revoke all on public.push_subscriptions from anon, authenticated;

-- ---------------------------------------------------------------------------
-- Scheduler. Needs two Vault secrets (set once, per environment):
--   select vault.create_secret('https://<your-domain>/api/cron/reminders', 'reminders_url');
--   select vault.create_secret('<CRON_SECRET from .env>', 'cron_secret');
-- Until both exist the job does nothing.
-- ---------------------------------------------------------------------------
create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function private.ping_reminders()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target text;
  secret text;
begin
  select decrypted_secret into target from vault.decrypted_secrets where name = 'reminders_url';
  select decrypted_secret into secret from vault.decrypted_secrets where name = 'cron_secret';
  if target is null or secret is null then
    return;
  end if;
  perform net.http_post(
    url := target,
    headers := jsonb_build_object('Authorization', 'Bearer ' || secret, 'Content-Type', 'application/json'),
    body := '{}'::jsonb,
    timeout_milliseconds := 20000
  );
end;
$$;

revoke execute on function private.ping_reminders() from public, anon, authenticated;

select cron.unschedule(jobid) from cron.job where jobname = 'send-reminders';
select cron.schedule('send-reminders', '*/5 * * * *', $$ select private.ping_reminders(); $$);
