-- ─────────────────────────────────────────────────────────────────────────────
-- Guest wishes for the GitHub Pages site (no server needed).
-- Run once in Supabase → SQL Editor. Safe to run again.
--
-- 1. Replace YOUR-ADMIN-EMAIL below with the email you will sign in with.
-- 2. Run the whole script.
-- 3. Authentication → Users → "Add user" → that email + a password
--    (tick "Auto confirm user").
--
-- Security is enforced by the database itself (Row Level Security):
--   • Guests (anon key) can ONLY add new wishes, which always start unapproved,
--     and can ONLY read approved wishes (name, message, date) via a view.
--   • Only the admin email can see waiting wishes, approve or delete them.
--   • Length limits, a no-links rule and per-device / per-hour rate limits
--     are checked on every insert, so the browser cannot bypass them.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;

create table if not exists public.wishes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(btrim(name)) between 2 and 60),
  message     text not null check (char_length(btrim(message)) between 3 and 500),
  approved    boolean not null default false,
  device_id   uuid not null,
  ip_hash     text,
  created_at  timestamptz not null default now(),
  constraint wishes_no_links check (message !~* '(https?://|www\.)')
);
-- Older installs from schema.sql required ip_hash; it is optional here.
alter table public.wishes alter column ip_hash drop not null;

create index if not exists wishes_public on public.wishes (approved, created_at desc);
create index if not exists wishes_device_recent on public.wishes (device_id, created_at desc);

-- Who may moderate. Add more family emails with extra insert lines.
create table if not exists public.admin_emails (email text primary key);
insert into public.admin_emails (email) values (lower('YOUR-ADMIN-EMAIL'))
  on conflict do nothing;

create or replace function public.is_wedding_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.admin_emails
    where email = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

-- Server-side spam protection: 5 wishes per device per 10 minutes,
-- 300 wishes per hour overall.
create or replace function public.wishes_guard() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_wedding_admin() then
    new.approved := false;               -- guests can never self-approve
  end if;
  new.name := btrim(new.name);
  new.message := btrim(new.message);
  if (select count(*) from public.wishes
        where device_id = new.device_id and created_at > now() - interval '10 minutes') >= 5
     or (select count(*) from public.wishes where created_at > now() - interval '1 hour') >= 300 then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

drop trigger if exists wishes_guard on public.wishes;
create trigger wishes_guard before insert on public.wishes
  for each row execute function public.wishes_guard();

-- Row Level Security
alter table public.wishes enable row level security;
alter table public.admin_emails enable row level security;

revoke all on public.wishes from anon, authenticated;
revoke all on public.admin_emails from anon, authenticated;
grant insert (name, message, device_id) on public.wishes to anon, authenticated;
grant select, update, delete on public.wishes to authenticated;

drop policy if exists "guests add wishes" on public.wishes;
create policy "guests add wishes" on public.wishes
  for insert to anon, authenticated with check (approved = false or public.is_wedding_admin());

drop policy if exists "admin reads all" on public.wishes;
create policy "admin reads all" on public.wishes
  for select to authenticated using (public.is_wedding_admin());

drop policy if exists "admin approves" on public.wishes;
create policy "admin approves" on public.wishes
  for update to authenticated using (public.is_wedding_admin()) with check (public.is_wedding_admin());

drop policy if exists "admin deletes" on public.wishes;
create policy "admin deletes" on public.wishes
  for delete to authenticated using (public.is_wedding_admin());

-- What everyone can read: approved wishes only, without device ids.
create or replace view public.approved_wishes
with (security_invoker = false) as
  select id, name, message, created_at
  from public.wishes
  where approved
  order by created_at desc
  limit 200;

revoke all on public.approved_wishes from anon, authenticated;
grant select on public.approved_wishes to anon, authenticated;
