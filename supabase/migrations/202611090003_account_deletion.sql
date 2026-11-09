begin;
-- This runs in the same transaction as Auth deletion: failure rolls all cleanup back.
create or replace function public.clean_deleted_account()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if exists(select 1 from public.profiles where id=old.id and role='admin') then
    raise exception 'Administrator accounts must be demoted by another administrator before deletion';
  end if;
  delete from public.user_feedback where user_id=old.id;
  delete from public.invitations where lower(invited_email)=lower(old.email);
  update public.vocabularies set author_name='Former Contributor', author_rank='Contributor' where created_by=old.id;
  update public.sentence_patterns set author_name='Former Contributor', author_rank='Contributor' where created_by=old.id;
  update public.quiz_topics set author_name='Former Contributor', author_rank='Contributor' where created_by=old.id;
  update public.quiz_steps set author_name='Former Contributor', author_rank='Contributor' where created_by=old.id;
  update public.essay_submissions set reviewer_name='Former Contributor', reviewer_rank='Contributor' where reviewed_by=old.id;
  return old;
end;
$$;
drop trigger if exists before_account_deleted on auth.users;
create trigger before_account_deleted before delete on auth.users for each row execute function public.clean_deleted_account();
commit;
