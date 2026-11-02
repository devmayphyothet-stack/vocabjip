-- ============================================================
-- VOCABJIP SUPABASE DATABASE SCHEMA
-- Run this script in your Supabase SQL Editor (Dashboard -> SQL Editor)
-- ============================================================

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. PROFILES TABLE (Stores user learning goals, streak & display name)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  email text,
  display_name text default 'TOPIK Learner',
  target_level text default 'TOPIK II Level 4',
  streak_days int default 1,
  daily_goal int default 3,
  daily_completed int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- 2. SAVED VOCABULARY BOOKMARKS
create table if not exists public.saved_vocabs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  vocab_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, vocab_id)
);

alter table public.saved_vocabs enable row level security;

create policy "Users can manage their saved vocabs"
  on public.saved_vocabs for all
  using (auth.uid() = user_id);

-- 3. SAVED PATTERNS BOOKMARKS
create table if not exists public.saved_patterns (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  pattern_id text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, pattern_id)
);

alter table public.saved_patterns enable row level security;

create policy "Users can manage their saved patterns"
  on public.saved_patterns for all
  using (auth.uid() = user_id);

-- 4. ESSAY & WONGOJI DRAFTS
create table if not exists public.drafts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text check (type in ('Q53', 'Q54', 'statement')) not null,
  title text not null,
  content text default '',
  char_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.drafts enable row level security;

create policy "Users can manage their drafts"
  on public.drafts for all
  using (auth.uid() = user_id);

-- 5. COMMUNITY PUBLISHED ESSAYS (Phase 3)
create table if not exists public.community_essays (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  author_name text not null,
  type text check (type in ('Q53', 'Q54', 'statement')) not null,
  title text not null,
  content text not null,
  score_estimate text,
  likes_count int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.community_essays enable row level security;

create policy "Anyone can read published community essays"
  on public.community_essays for select
  using (true);

create policy "Authenticated users can insert essays"
  on public.community_essays for insert
  with check (auth.uid() = user_id);

create policy "Users can update or delete their own published essays"
  on public.community_essays for update
  using (auth.uid() = user_id);

-- AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', 'TOPIK Learner')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

