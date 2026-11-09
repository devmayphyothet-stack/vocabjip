begin;

-- Use a definer helper so profile policies do not recursively query themselves.
create or replace function public.has_staff_role(allowed_roles text[])
returns boolean language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = auth.uid() and role = any(allowed_roles));
$$;
revoke all on function public.has_staff_role(text[]) from public;
grant execute on function public.has_staff_role(text[]) to anon, authenticated;

-- A row-level policy cannot prevent changing a sensitive column in one's own row.
revoke update on public.profiles from anon, authenticated;
grant update(display_name, target_level, streak_days, daily_goal, daily_completed, updated_at) on public.profiles to authenticated;
drop policy if exists "Anyone can view contributor and admin profiles" on public.profiles;
drop policy if exists "Admins can view profiles" on public.profiles;
create policy "Admins can view profiles" on public.profiles for select to authenticated
  using (public.has_staff_role(array['admin']));
-- Attribution is stored on published curriculum; private profile rows are not public.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id, email, display_name, role)
  values(new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', 'TOPIK Learner'), 'user');
  return new;
end;
$$;

create or replace function public.set_profile_role(target_user_id uuid, new_role text)
returns void language plpgsql security definer set search_path = '' as $$
begin
  if not public.has_staff_role(array['admin']) then raise exception 'Administrator access required'; end if;
  if new_role not in ('user', 'contributor', 'admin') then raise exception 'Invalid role'; end if;
  if target_user_id = auth.uid() then raise exception 'Ask another administrator to change your role'; end if;
  update public.profiles set role = new_role where id = target_user_id;
end;
$$;
revoke all on function public.set_profile_role(uuid, text) from public;
grant execute on function public.set_profile_role(uuid, text) to authenticated;

-- Invitations are validated and consumed atomically after email verification.
drop policy if exists "Anyone can check unused invitations" on public.invitations;
drop policy if exists "Anyone can redeem invitation" on public.invitations;
create or replace function public.redeem_contributor_invitation(invite_code text)
returns void language plpgsql security definer set search_path = '' as $$
declare invitation public.invitations; verified_email text;
begin
  select email into verified_email from auth.users where id = auth.uid() and email_confirmed_at is not null;
  if verified_email is null then raise exception 'Verify your email before redeeming an invitation'; end if;
  select * into invitation from public.invitations
    where code = upper(trim(invite_code)) and not is_used
      and (expires_at is null or expires_at > now()) for update;
  if not found then raise exception 'Invalid, expired, or already used invitation'; end if;
  if invitation.invited_email is not null and lower(trim(invitation.invited_email)) <> lower(verified_email) then
    raise exception 'This invitation belongs to a different email address';
  end if;
  update public.profiles set role = invitation.role where id = auth.uid();
  update public.invitations set is_used = true, used_by = auth.uid(), used_at = now() where id = invitation.id;
end;
$$;
revoke all on function public.redeem_contributor_invitation(text) from public;
grant execute on function public.redeem_contributor_invitation(text) to authenticated;

drop policy if exists "Students can view their own essay submissions" on public.essay_submissions;
drop policy if exists "Students can view their own essay submissions" on public.essay_submissions;
create policy "Students can view their own essay submissions" on public.essay_submissions for select to authenticated
  using (auth.uid() = student_id or public.has_staff_role(array['contributor', 'admin']));
drop policy if exists "Anyone can insert essay submissions" on public.essay_submissions;
drop policy if exists "Students can submit their own essays" on public.essay_submissions;
create policy "Students can submit their own essays" on public.essay_submissions for insert to authenticated
  with check (auth.uid() = student_id and status = 'pending' and score is null and reviewed_by is null
    and reviewed_at is null and reviewer_name is null and reviewer_rank is null
    and strengths is null and improvements is null and corrected_sample is null and overall_comment is null);

-- Reviewers can grade and claim submissions, but cannot rewrite the student's original essay or owner.
revoke update on public.essay_submissions from anon, authenticated;
grant update(status, score, max_score, strengths, improvements, corrected_sample, overall_comment,
  reviewed_by, reviewer_name, reviewer_rank, reviewed_at, updated_at) on public.essay_submissions to authenticated;

-- Shared keys stay available only to admins and the server, never app clients.
drop policy if exists "Anyone can read app settings" on public.app_settings;
drop policy if exists "Admins can read app settings" on public.app_settings;
create policy "Admins can read app settings" on public.app_settings for select to authenticated
  using (public.has_staff_role(array['admin']));
drop policy if exists "Anyone can insert vocab lens cache" on public.vocab_lens_cache;

-- Reject stale writes atomically instead of overwriting a newer draft on another device.
create or replace function public.save_draft_if_newer(
  draft_id uuid, draft_type text, draft_title text, draft_content text,
  draft_char_count integer, draft_updated_at timestamptz
) returns boolean language plpgsql security invoker set search_path = '' as $$
declare affected integer;
begin
  if auth.uid() is null then raise exception 'Sign in to sync drafts'; end if;
  insert into public.drafts(id, user_id, type, title, content, char_count, updated_at)
    values(draft_id, auth.uid(), draft_type, draft_title, draft_content, draft_char_count, draft_updated_at)
  on conflict(id) do update set type = excluded.type, title = excluded.title,
    content = excluded.content, char_count = excluded.char_count, updated_at = excluded.updated_at
  where public.drafts.user_id = auth.uid() and public.drafts.updated_at <= excluded.updated_at;
  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;
revoke all on function public.save_draft_if_newer(uuid, text, text, text, integer, timestamptz) from public;
grant execute on function public.save_draft_if_newer(uuid, text, text, text, integer, timestamptz) to authenticated;

-- Only the server may consume the shared AI budget. One row per account/day.
create table if not exists public.ai_daily_usage (
  user_id uuid references auth.users(id) on delete cascade,
  usage_date date not null default current_date,
  requests integer not null default 0,
  primary key(user_id, usage_date)
);
alter table public.ai_daily_usage enable row level security;
create or replace function public.consume_vocab_lens_budget(account_id uuid)
returns boolean language plpgsql security definer set search_path = '' as $$
declare affected integer;
begin
  insert into public.ai_daily_usage(user_id, usage_date, requests) values(account_id, current_date, 1)
  on conflict(user_id, usage_date) do update set requests = public.ai_daily_usage.requests + 1
    where public.ai_daily_usage.requests < 50;
  get diagnostics affected = row_count;
  return affected > 0;
end;
$$;
revoke all on function public.consume_vocab_lens_budget(uuid) from public, anon, authenticated;
grant execute on function public.consume_vocab_lens_budget(uuid) to service_role;

-- Publish attribution only; email, learning goals, and essays stay private.
create or replace view public.contributor_directory as
  select id, display_name, role, created_at from public.profiles where role in ('contributor', 'admin');
revoke all on public.contributor_directory from public, anon, authenticated;
grant select on public.contributor_directory to anon, authenticated;
create or replace view public.contributor_review_counts as
  select reviewed_by as reviewer_id, count(*)::integer as review_count
  from public.essay_submissions where status = 'reviewed' and reviewed_by is not null group by reviewed_by;
revoke all on public.contributor_review_counts from public, anon, authenticated;
grant select on public.contributor_review_counts to anon, authenticated;

-- A contributor may submit content for review, but cannot approve their own submissions.
drop policy if exists "Contributors can insert vocabularies" on public.vocabularies;
create policy "Contributors can insert vocabularies" on public.vocabularies for insert to authenticated
  with check (auth.uid() = created_by and public.has_staff_role(array['contributor', 'admin']) and status in ('draft', 'pending_review'));
drop policy if exists "Contributors can update their own drafts" on public.vocabularies;
create policy "Contributors can update their own drafts" on public.vocabularies for update to authenticated
  using (auth.uid() = created_by and public.has_staff_role(array['contributor', 'admin']) and status in ('draft', 'rejected'))
  with check (auth.uid() = created_by and status in ('draft', 'pending_review'));
drop policy if exists "Contributors can insert patterns" on public.sentence_patterns;
create policy "Contributors can insert patterns" on public.sentence_patterns for insert to authenticated
  with check (auth.uid() = created_by and public.has_staff_role(array['contributor', 'admin']) and status in ('draft', 'pending_review'));
drop policy if exists "Contributors can update their own pattern drafts" on public.sentence_patterns;
create policy "Contributors can update their own pattern drafts" on public.sentence_patterns for update to authenticated
  using (auth.uid() = created_by and public.has_staff_role(array['contributor', 'admin']) and status in ('draft', 'rejected'))
  with check (auth.uid() = created_by and status in ('draft', 'pending_review'));
drop policy if exists "Contributors can insert quiz steps" on public.quiz_steps;
create policy "Contributors can insert quiz steps" on public.quiz_steps for insert to authenticated
  with check (auth.uid() = created_by and public.has_staff_role(array['contributor', 'admin']) and status in ('draft', 'pending_review'));
drop policy if exists "Contributors can update their own quiz steps" on public.quiz_steps;
create policy "Contributors can update their own quiz steps" on public.quiz_steps for update to authenticated
  using (auth.uid() = created_by and public.has_staff_role(array['contributor', 'admin']) and status in ('draft', 'rejected', 'pending_review'))
  with check (auth.uid() = created_by and status in ('draft', 'pending_review'));

commit;
