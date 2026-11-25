-- ─────────────────────────────────────────────────────────────────────────────
-- Wedding invitation — Supabase schema
-- Run this once in Supabase → SQL Editor.
--
-- Security model: Row Level Security is ON and there are NO policies for the
-- `anon` / `authenticated` roles, so the public Supabase API can neither read
-- nor write these tables. Only the Netlify Functions, using the service-role
-- key stored as a server-side environment variable, can access them.
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;

create table if not exists public.wishes (
  id          uuid primary key default gen_random_uuid(),
  name        text not null check (char_length(name) between 2 and 60),
  message     text not null check (char_length(message) between 3 and 500),
  approved    boolean not null default false,
  device_id   uuid not null,
  ip_hash     text not null,
  created_at  timestamptz not null default now()
);

create index if not exists wishes_public on public.wishes (approved, created_at desc);
create index if not exists wishes_ip_recent on public.wishes (ip_hash, created_at desc);

alter table public.wishes enable row level security;

-- Belt and braces: make sure the public roles hold no table privileges.
revoke all on public.wishes from anon, authenticated;
