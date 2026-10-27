-- Chairperson access is granted by approving a sign-in email, so the super
-- admin no longer has to locate the account in the directory first. The email
-- must belong to an existing account; unknown or invalid emails are rejected.
create function public.approve_chairperson(target_email text)
returns void language plpgsql security definer set search_path = '' as $$
declare target uuid;
declare existing_role text;
begin
  if not public.is_super_admin() then raise exception 'Super admin access required.' using errcode = '42501'; end if;
  select u.id into target from auth.users u
    where lower(u.email) = lower(btrim(coalesce(target_email, '')));
  if not found then raise exception 'No account found with this email.'; end if;
  select p.role into existing_role from public.profiles p where p.id = target;
  if existing_role = 'chairperson' then raise exception 'This account already has chairperson access.'; end if;
  if existing_role = 'super_admin' then raise exception 'Change a super admin role from the account list instead.'; end if;
  perform public.set_user_role(target, 'chairperson');
end;
$$;
revoke all on function public.approve_chairperson(text) from public, anon, authenticated;
grant execute on function public.approve_chairperson(text) to authenticated;
