begin;
alter table public.profiles add column if not exists avatar_key text not null default 'learner';
alter table public.profiles add column if not exists bio text not null default '';
alter table public.profiles add column if not exists korean_background text not null default '';
do $$ begin
  if not exists(select 1 from pg_constraint where conname='profile_public_fields_valid' and conrelid='public.profiles'::regclass) then
    alter table public.profiles add constraint profile_public_fields_valid check (
      avatar_key in ('learner','sprout','star','flower','sun','pencil')
      and length(bio)<=300 and length(korean_background)<=300
    ) not valid;
  end if;
end $$;
-- Existing long names/goals remain readable; new edits are validated by the function below.
grant update(avatar_key, bio, korean_background) on public.profiles to authenticated;
create or replace function public.update_own_profile(profile_fields jsonb)
returns public.profiles language plpgsql security invoker set search_path = '' as $$
declare updated public.profiles;
begin
  if auth.uid() is null then raise exception 'Sign in to edit your profile'; end if;
  if jsonb_typeof(profile_fields) <> 'object' or profile_fields is null then raise exception 'Invalid profile'; end if;
  if length(trim(coalesce(profile_fields->>'display_name',''))) not between 1 and 60
    or coalesce(profile_fields->>'avatar_key','') not in ('learner','sprout','star','flower','sun','pencil')
    or coalesce(profile_fields->>'target_level','') not in ('TOPIK II Level 3','TOPIK II Level 4','TOPIK II Level 5','TOPIK II Level 6')
    or coalesce(profile_fields->>'daily_goal','') !~ '^([1-9]|1[0-9]|20)$'
    or length(coalesce(profile_fields->>'bio','')) > 300
    or length(coalesce(profile_fields->>'korean_background','')) > 300 then raise exception 'Invalid profile fields'; end if;
  update public.profiles set display_name = trim(profile_fields->>'display_name'),
    avatar_key = profile_fields->>'avatar_key', target_level = profile_fields->>'target_level',
    daily_goal = (profile_fields->>'daily_goal')::integer,
    bio = trim(coalesce(profile_fields->>'bio','')), korean_background = trim(coalesce(profile_fields->>'korean_background','')),
    updated_at = now() where id = auth.uid() returning * into updated;
  if not found then raise exception 'Profile not found'; end if;
  return updated;
end;
$$;
revoke all on function public.update_own_profile(jsonb) from public;
grant execute on function public.update_own_profile(jsonb) to authenticated;

-- Append public, self-reported Contributor fields to the safe attribution view.
create or replace view public.contributor_directory as
  select id, display_name, role, created_at, avatar_key, bio, korean_background
  from public.profiles where role in ('contributor','admin');
revoke all on public.contributor_directory from public, anon, authenticated;
grant select on public.contributor_directory to anon, authenticated;

-- Keep public attribution consistent after a display-name edit.
create or replace function public.sync_contributor_display_name()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.vocabularies set author_name=new.display_name, updated_at=now() where created_by=new.id;
  update public.sentence_patterns set author_name=new.display_name, updated_at=now() where created_by=new.id;
  update public.quiz_topics set author_name=new.display_name, updated_at=now() where created_by=new.id;
  update public.quiz_steps set author_name=new.display_name, updated_at=now() where created_by=new.id;
  update public.essay_submissions set reviewer_name=new.display_name where reviewed_by=new.id;
  return new;
end;
$$;
drop trigger if exists on_profile_name_changed on public.profiles;
create trigger on_profile_name_changed after update of display_name on public.profiles
  for each row when (old.display_name is distinct from new.display_name) execute function public.sync_contributor_display_name();

-- Email is sourced only from verified Auth changes, never a profile form.
create or replace function public.sync_verified_profile_email()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  update public.profiles set email = new.email where id = new.id;
  return new;
end;
$$;
drop trigger if exists on_verified_email_changed on auth.users;
create trigger on_verified_email_changed after update of email on auth.users
  for each row when (old.email is distinct from new.email) execute function public.sync_verified_profile_email();

alter table public.drafts add column if not exists metadata jsonb not null default '{}'::jsonb;
-- A distinct function keeps older Phase 1 clients compatible.
create or replace function public.save_draft_document(
  draft_id uuid, draft_type text, draft_title text, draft_content text,
  draft_char_count integer, draft_updated_at timestamptz, draft_metadata jsonb
) returns boolean language plpgsql security invoker set search_path = '' as $$
declare affected integer;
begin
  if auth.uid() is null then raise exception 'Sign in to sync drafts'; end if;
  if jsonb_typeof(draft_metadata) <> 'object' or draft_metadata is null then raise exception 'Invalid document'; end if;
  insert into public.drafts(id,user_id,type,title,content,char_count,updated_at,metadata)
    values(draft_id,auth.uid(),draft_type,draft_title,draft_content,draft_char_count,draft_updated_at,draft_metadata)
  on conflict(id) do update set type=excluded.type,title=excluded.title,content=excluded.content,
    char_count=excluded.char_count,updated_at=excluded.updated_at,metadata=excluded.metadata
    where public.drafts.user_id=auth.uid() and public.drafts.updated_at<=excluded.updated_at;
  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;
revoke all on function public.save_draft_document(uuid,text,text,text,integer,timestamptz,jsonb) from public;
grant execute on function public.save_draft_document(uuid,text,text,text,integer,timestamptz,jsonb) to authenticated;
-- Legacy clients cannot flatten a complete four-section statement by saving only one section.
create or replace function public.save_draft_if_newer(
  draft_id uuid, draft_type text, draft_title text, draft_content text,
  draft_char_count integer, draft_updated_at timestamptz
) returns boolean language plpgsql security invoker set search_path = '' as $$
declare affected integer;
begin
  if auth.uid() is null then raise exception 'Sign in to sync drafts'; end if;
  insert into public.drafts(id,user_id,type,title,content,char_count,updated_at)
    values(draft_id,auth.uid(),draft_type,draft_title,draft_content,draft_char_count,draft_updated_at)
  on conflict(id) do update set type=excluded.type,title=excluded.title,content=excluded.content,
    char_count=excluded.char_count,updated_at=excluded.updated_at
    where public.drafts.user_id=auth.uid() and public.drafts.updated_at<=excluded.updated_at
      and not (public.drafts.type='statement' and public.drafts.metadata ? 'sections');
  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;

commit;
