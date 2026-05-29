-- CampusConnect Supabase setup (beginner-friendly)
-- Run this SQL in Supabase SQL Editor
-- https://supabase.com/dashboard -> SQL Editor

-- 1) Notes table
create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  content text not null,
  created_at timestamptz not null default now()
);

-- 2) Contacts table
create table if not exists public.contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  name text,
  email text not null,
  message text not null,
  created_at timestamptz not null default now()
);

-- 3) Enable Row Level Security (RLS)
alter table public.notes enable row level security;
alter table public.contacts enable row level security;

-- 4) Notes policies: each user can only read/write their own notes
-- SELECT
create policy "notes_select_own"
on public.notes
for select
using (auth.uid() = user_id);

-- INSERT
create policy "notes_insert_own"
on public.notes
for insert
with check (auth.uid() = user_id);

-- (We don't implement update/delete in this beginner app, but you can add later.)

-- 5) Contacts policies:
-- Logged-in users can view/write their own contact rows
-- (We still verify JWT in backend, so writes come from logged-in users.)

create policy "contacts_select_own"
on public.contacts
for select
using (auth.uid() = user_id);

create policy "contacts_insert_own"
on public.contacts
for insert
with check (auth.uid() = user_id);

-- Helpful indexes
create index if not exists notes_user_id_idx on public.notes(user_id);
create index if not exists contacts_user_id_idx on public.contacts(user_id);

