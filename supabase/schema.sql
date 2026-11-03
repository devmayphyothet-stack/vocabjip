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
  role text check (role in ('user', 'contributor', 'admin')) default 'user',
  streak_days int default 1,
  daily_goal int default 3,
  daily_completed int default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure column exists if table was already created
alter table public.profiles add column if not exists role text check (role in ('user', 'contributor', 'admin')) default 'user';

-- Enable RLS on profiles
alter table public.profiles enable row level security;

drop policy if exists "Users can view their own profile" on public.profiles;
create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
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

drop policy if exists "Users can manage their saved vocabs" on public.saved_vocabs;
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

drop policy if exists "Users can manage their saved patterns" on public.saved_patterns;
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

drop policy if exists "Users can manage their drafts" on public.drafts;
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

drop policy if exists "Anyone can read published community essays" on public.community_essays;
create policy "Anyone can read published community essays"
  on public.community_essays for select
  using (true);

drop policy if exists "Authenticated users can insert essays" on public.community_essays;
create policy "Authenticated users can insert essays"
  on public.community_essays for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update or delete their own published essays" on public.community_essays;
create policy "Users can update or delete their own published essays"
  on public.community_essays for update
  using (auth.uid() = user_id);

-- AUTOMATIC PROFILE CREATION TRIGGER ON SIGNUP
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, display_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', 'TOPIK Learner'),
    case
      when lower(new.email) in ('admin@vocabjip.com', 'dev.mayphyothet@gmail.com') then 'admin'
      when new.raw_user_meta_data->>'requested_role' in ('contributor', 'admin') then new.raw_user_meta_data->>'requested_role'
      else 'user'
    end
  );
  return new;
end;
$$ language plpgsql security definer;

-- Drop trigger if exists and recreate
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- 6. USER FEEDBACK TABLE
-- ============================================================
create table if not exists public.user_feedback (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete set null,
  category text not null,
  rating int default 5,
  title text not null,
  message text not null,
  email text,
  status text default 'new' check (status in ('new', 'in_progress', 'resolved', 'closed')),
  admin_notes text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Ensure columns exist if table was already created
alter table public.user_feedback add column if not exists status text default 'new';
alter table public.user_feedback add column if not exists admin_notes text;

alter table public.user_feedback enable row level security;

drop policy if exists "Anyone can insert user feedback" on public.user_feedback;
create policy "Anyone can insert user feedback"
  on public.user_feedback for insert
  with check (true);

drop policy if exists "Users can view their own feedback" on public.user_feedback;
create policy "Users can view their own feedback"
  on public.user_feedback for select
  using (auth.uid() = user_id);

drop policy if exists "Admins can view all feedback" on public.user_feedback;
create policy "Admins can view all feedback"
  on public.user_feedback for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

drop policy if exists "Admins can update feedback status" on public.user_feedback;
create policy "Admins can update feedback status"
  on public.user_feedback for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- 7. DYNAMIC CURRICULUM: VOCABULARIES TABLE
-- ============================================================
create table if not exists public.vocabularies (
  id text primary key,
  spoken text not null,
  written text not null,
  pronunciation text default '',
  category text not null,
  myanmar_meaning text not null,
  english_meaning text not null,
  usage_tip text default '',
  example_korean text not null,
  example_myanmar text not null,
  status text check (status in ('draft', 'pending_review', 'approved', 'rejected')) default 'pending_review',
  rejection_reason text,
  created_by uuid references public.profiles(id) on delete set null,
  author_name text default 'VocabJip Educator',
  author_rank text default 'Contributor',
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.vocabularies add column if not exists author_name text default 'VocabJip Educator';
alter table public.vocabularies add column if not exists author_rank text default 'Contributor';

alter table public.vocabularies enable row level security;

-- Mobile users / students read all approved vocabularies
drop policy if exists "Anyone can read approved vocabularies" on public.vocabularies;
create policy "Anyone can read approved vocabularies"
  on public.vocabularies for select
  using (status = 'approved');

-- Contributors can view their own submissions (draft, pending, rejected)
drop policy if exists "Contributors can view their own vocab submissions" on public.vocabularies;
create policy "Contributors can view their own vocab submissions"
  on public.vocabularies for select
  using (auth.uid() = created_by);

-- Contributors can submit new vocabularies
drop policy if exists "Contributors can insert vocabularies" on public.vocabularies;
create policy "Contributors can insert vocabularies"
  on public.vocabularies for insert
  with check (auth.uid() = created_by);

-- Contributors can update their own drafts
drop policy if exists "Contributors can update their own drafts" on public.vocabularies;
create policy "Contributors can update their own drafts"
  on public.vocabularies for update
  using (auth.uid() = created_by and status in ('draft', 'rejected'));

-- Admins can view, update, approve, and delete all vocabularies
drop policy if exists "Admins have full access on vocabularies" on public.vocabularies;
create policy "Admins have full access on vocabularies"
  on public.vocabularies for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- 8. DYNAMIC CURRICULUM: SENTENCE PATTERNS TABLE
-- ============================================================
create table if not exists public.sentence_patterns (
  id text primary key,
  question_number text check (question_number in ('Q51', 'Q52', 'Q53', 'Q54')) not null,
  title text not null,
  myanmar_title text not null,
  description text not null,
  pattern_formula text not null,
  example_korean text not null,
  example_myanmar text not null,
  key_phrases text[] default array[]::text[],
  status text check (status in ('draft', 'pending_review', 'approved', 'rejected')) default 'pending_review',
  rejection_reason text,
  created_by uuid references public.profiles(id) on delete set null,
  author_name text default 'VocabJip Educator',
  author_rank text default 'Contributor',
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.sentence_patterns add column if not exists author_name text default 'VocabJip Educator';
alter table public.sentence_patterns add column if not exists author_rank text default 'Contributor';

alter table public.sentence_patterns enable row level security;

-- Mobile users read all approved sentence patterns
drop policy if exists "Anyone can read approved patterns" on public.sentence_patterns;
create policy "Anyone can read approved patterns"
  on public.sentence_patterns for select
  using (status = 'approved');

-- Contributors view their own pattern submissions
drop policy if exists "Contributors can view their own pattern submissions" on public.sentence_patterns;
create policy "Contributors can view their own pattern submissions"
  on public.sentence_patterns for select
  using (auth.uid() = created_by);

-- Contributors insert new patterns
drop policy if exists "Contributors can insert patterns" on public.sentence_patterns;
create policy "Contributors can insert patterns"
  on public.sentence_patterns for insert
  with check (auth.uid() = created_by);

-- Contributors update their drafts
drop policy if exists "Contributors can update their own pattern drafts" on public.sentence_patterns;
create policy "Contributors can update their own pattern drafts"
  on public.sentence_patterns for update
  using (auth.uid() = created_by and status in ('draft', 'rejected'));

-- Admins have full access on patterns
drop policy if exists "Admins have full access on patterns" on public.sentence_patterns;
create policy "Admins have full access on patterns"
  on public.sentence_patterns for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- 9. DYNAMIC CURRICULUM: ESSAY PROMPTS TABLE
-- ============================================================
create table if not exists public.essay_prompts (
  id text primary key,
  type text check (type in ('Q53', 'Q54', 'statement')) not null,
  title text not null,
  prompt_text text not null,
  sub_questions text[] default array[]::text[],
  sample_answer text,
  scoring_criteria text,
  status text check (status in ('draft', 'pending_review', 'approved', 'rejected')) default 'pending_review',
  rejection_reason text,
  created_by uuid references public.profiles(id) on delete set null,
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.essay_prompts enable row level security;

drop policy if exists "Anyone can read approved essay prompts" on public.essay_prompts;
create policy "Anyone can read approved essay prompts"
  on public.essay_prompts for select
  using (status = 'approved');

drop policy if exists "Admins have full access on essay prompts" on public.essay_prompts;
create policy "Admins have full access on essay prompts"
  on public.essay_prompts for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- 10. CONTRIBUTOR INVITATIONS TABLE (PHASE 3)
-- ============================================================
create table if not exists public.invitations (
  id uuid default uuid_generate_v4() primary key,
  code text unique not null,
  invited_email text,
  role text default 'contributor' check (role in ('contributor', 'admin')),
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  expires_at timestamp with time zone,
  is_used boolean default false,
  used_by uuid references public.profiles(id) on delete set null,
  used_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.invitations enable row level security;

-- Admins full access to invitations
drop policy if exists "Admins manage invitations" on public.invitations;
create policy "Admins manage invitations"
  on public.invitations for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Anyone can check unused invitations by code for registration
drop policy if exists "Anyone can check unused invitations" on public.invitations;
create policy "Anyone can check unused invitations"
  on public.invitations for select
  using (not is_used);

-- Anyone can mark an invitation as used during signup
drop policy if exists "Anyone can redeem invitation" on public.invitations;
create policy "Anyone can redeem invitation"
  on public.invitations for update
  using (not is_used);

-- Allow public reading of contributor/admin display names and roles for attribution
drop policy if exists "Anyone can view contributor and admin profiles" on public.profiles;
create policy "Anyone can view contributor and admin profiles"
  on public.profiles for select
  using (role in ('contributor', 'admin'));

-- ============================================================
-- 11. DYNAMIC CURRICULUM: QUIZ TOPICS & STEPS (PHASE 4)
-- ============================================================
create table if not exists public.quiz_topics (
  id text primary key,
  title text not null,
  myanmar_title text not null,
  category text not null,
  description text default '',
  created_by uuid references public.profiles(id) on delete set null,
  author_name text default 'VocabJip Educator',
  author_rank text default 'Contributor',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.quiz_topics enable row level security;

drop policy if exists "Anyone can read quiz topics" on public.quiz_topics;
create policy "Anyone can read quiz topics"
  on public.quiz_topics for select
  using (true);

drop policy if exists "Contributors and admins can insert quiz topics" on public.quiz_topics;
create policy "Contributors and admins can insert quiz topics"
  on public.quiz_topics for insert
  with check (auth.uid() = created_by);

drop policy if exists "Creator or admin can update quiz topics" on public.quiz_topics;
create policy "Creator or admin can update quiz topics"
  on public.quiz_topics for update
  using (
    auth.uid() = created_by or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

drop policy if exists "Admins can delete quiz topics" on public.quiz_topics;
create policy "Admins can delete quiz topics"
  on public.quiz_topics for delete
  using (
    auth.uid() = created_by or
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  );

create table if not exists public.quiz_steps (
  id text primary key,
  topic_id text references public.quiz_topics(id) on delete cascade not null,
  step_number int not null,
  title text not null,
  passing_score int default 3 not null,
  questions jsonb not null default '[]'::jsonb,
  status text check (status in ('draft', 'pending_review', 'approved', 'rejected')) default 'pending_review',
  rejection_reason text,
  created_by uuid references public.profiles(id) on delete set null,
  author_name text default 'VocabJip Educator',
  author_rank text default 'Contributor',
  reviewed_by uuid references public.profiles(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(topic_id, step_number)
);

alter table public.quiz_steps enable row level security;

-- Everyone can view quiz steps (Studio contributors see in-progress/claimed steps, Mobile filters approved)
drop policy if exists "Anyone can read quiz steps" on public.quiz_steps;
create policy "Anyone can read quiz steps"
  on public.quiz_steps for select
  using (true);

drop policy if exists "Contributors can insert quiz steps" on public.quiz_steps;
create policy "Contributors can insert quiz steps"
  on public.quiz_steps for insert
  with check (auth.uid() = created_by);

drop policy if exists "Contributors can update their own quiz steps" on public.quiz_steps;
create policy "Contributors can update their own quiz steps"
  on public.quiz_steps for update
  using (auth.uid() = created_by and status in ('draft', 'rejected', 'pending_review'));

drop policy if exists "Contributors can delete their own draft quiz steps" on public.quiz_steps;
create policy "Contributors can delete their own draft quiz steps"
  on public.quiz_steps for delete
  using (auth.uid() = created_by and status in ('draft', 'rejected'));

drop policy if exists "Admins have full access on quiz steps" on public.quiz_steps;
create policy "Admins have full access on quiz steps"
  on public.quiz_steps for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- 12. STUDENT ESSAY SUBMISSIONS FOR TEACHER / CONTRIBUTOR REVIEW
-- ============================================================
create table if not exists public.essay_submissions (
  id uuid default uuid_generate_v4() primary key,
  student_id uuid references public.profiles(id) on delete cascade,
  student_name text default 'TOPIK Learner',
  question_type text check (question_type in ('Q53', 'Q54', 'statement')) not null,
  prompt_title text not null,
  content text not null,
  char_count int default 0,
  status text check (status in ('pending', 'in_review', 'reviewed')) default 'pending',
  score int,
  max_score int default 30,
  strengths text,
  improvements text,
  corrected_sample text,
  overall_comment text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewer_name text,
  reviewer_rank text,
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.essay_submissions enable row level security;

-- Students can read and insert their own essay submissions
drop policy if exists "Students can view their own essay submissions" on public.essay_submissions;
create policy "Students can view their own essay submissions"
  on public.essay_submissions for select
  using (auth.uid() = student_id or true);

drop policy if exists "Anyone can insert essay submissions" on public.essay_submissions;
create policy "Anyone can insert essay submissions"
  on public.essay_submissions for insert
  with check (true);

-- Contributors and Admins can view and update (grade/claim) essay submissions
drop policy if exists "Contributors and admins can grade essay submissions" on public.essay_submissions;
create policy "Contributors and admins can grade essay submissions"
  on public.essay_submissions for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role in ('contributor', 'admin')
    )
  );

-- ============================================================
-- 13. SYSTEM APP SETTINGS (ADMIN GEMINI API KEY ROTATION)
-- ============================================================
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_by uuid references public.profiles(id) on delete set null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.app_settings enable row level security;

-- Mobile/Web clients can read system settings (such as active Gemini key config for Smart Vocab Lens)
drop policy if exists "Anyone can read app settings" on public.app_settings;
create policy "Anyone can read app settings"
  on public.app_settings for select
  using (true);

-- ONLY Admins can insert/update/delete app settings
drop policy if exists "Only admins can modify app settings" on public.app_settings;
create policy "Only admins can modify app settings"
  on public.app_settings for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- ============================================================
-- 14. GLOBAL AI VOCAB LENS CACHE (SHARED DICTIONARY CACHE)
-- ============================================================
create table if not exists public.vocab_lens_cache (
  word_key text primary key,
  korean text not null,
  root_word text not null,
  romaja text default '',
  myanmar_meaning text not null,
  english_meaning text default '',
  spoken_equivalent text,
  written_equivalent text,
  topik_tip text,
  category text default 'General',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.vocab_lens_cache enable row level security;

drop policy if exists "Anyone can read vocab lens cache" on public.vocab_lens_cache;
create policy "Anyone can read vocab lens cache"
  on public.vocab_lens_cache for select
  using (true);

drop policy if exists "Anyone can insert vocab lens cache" on public.vocab_lens_cache;
create policy "Anyone can insert vocab lens cache"
  on public.vocab_lens_cache for insert
  with check (true);