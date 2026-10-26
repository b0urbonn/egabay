-- TEMPLATE ONLY. Do not paste this file into SQL Editor.
-- Run `npm run build:database`, then use supabase/generated/bootstrap_super_admin.sql
-- after the designated owner has signed in with their verified Google account.
-- This file is never imported or executed by the frontend.
begin;
do $$
declare target_id uuid; owner_email text := '__BOOTSTRAP_ADMIN_EMAIL__';
begin
  if owner_email = ('__BOOTSTRAP_ADMIN_' || 'EMAIL__') then
    raise exception 'This is a template. Run npm run build:database and use supabase/generated/bootstrap_super_admin.sql.';
  end if;
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

select u.email, p.role
from auth.users u
join public.profiles p on p.id = u.id
where lower(u.email) = lower('__BOOTSTRAP_ADMIN_EMAIL__');
