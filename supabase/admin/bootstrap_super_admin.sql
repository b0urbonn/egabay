-- Run in the project's SQL Editor AFTER the setup migration and after the
-- designated owner has signed in at least once with their verified Google account.
-- This file is never imported or executed by the frontend.
begin;
do $$
declare target_id uuid; owner_email text := '__BOOTSTRAP_ADMIN_EMAIL__';
begin
  select id into target_id from auth.users
    where lower(email) = lower(owner_email) and email_confirmed_at is not null;
  if target_id is null then
    raise exception 'First sign in with the verified Google account %, then run this script again.', owner_email;
  end if;
  update public.profiles set role = 'super_admin' where id = target_id;
  if not found then raise exception 'Profile missing. Apply the database setup first.'; end if;
end;
$$;
commit;
