-- Terminals can serve more than one transport type: a single 'kind' becomes a
-- 'kinds' set ('toda', 'jeepney', or both). terminal_groups stays many-to-many;
-- a group may link to a terminal when the group's kind is one the terminal
-- serves, so a mixed terminal can host a TODA group and a jeepney group.

alter table public.terminals add column kinds text[];
update public.terminals set kinds = array[kind];
alter table public.terminals alter column kinds set not null;
alter table public.terminals add constraint terminals_kinds_check
  check (cardinality(kinds) between 1 and 2 and kinds <@ array['toda', 'jeepney']::text[]);

create or replace function public.validate_group_assignments()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_table_name = 'groups' then
    if new.chairperson_id is not null and not exists(select 1 from public.profiles p where p.id = new.chairperson_id and p.role = 'chairperson') then
      raise exception 'Assign the chairperson role before assigning this group.';
    end if;
    if tg_op = 'UPDATE' and new.kind <> old.kind
      and exists(select 1 from public.terminal_groups where group_id = old.id) then
      raise exception 'Unlink the group terminals before changing its transport type.';
    end if;
  elsif tg_table_name = 'terminals' then
    if tg_op = 'UPDATE' and exists(
      select 1 from public.terminal_groups tg join public.groups g on g.id = tg.group_id
      where tg.terminal_id = new.id and not (g.kind = any(new.kinds))) then
      raise exception 'Unlink the groups of a transport type before removing it.';
    end if;
  elsif tg_table_name = 'terminal_groups' then
    if tg_op = 'DELETE' then
      if exists(select 1 from public.vehicles v join public.drivers d on d.profile_id = v.assigned_driver_id
        where v.terminal_id = old.terminal_id and d.group_id = old.group_id) then
        raise exception 'Move the terminal vehicles before unlinking this group.';
      end if;
      return old;
    end if;
    if not exists(select 1 from public.terminals t join public.groups g on g.id = new.group_id
      where t.id = new.terminal_id and g.kind = any(t.kinds)) then
      raise exception 'Groups can only link to terminals that serve their transport type.';
    end if;
  elsif tg_table_name = 'drivers' then
    if not exists(select 1 from public.profiles p where p.id = new.profile_id and p.role = 'driver') then
      raise exception 'A driver membership requires a driver profile.';
    end if;
    if tg_op = 'UPDATE' and (new.group_id <> old.group_id or new.membership_status <> 'approved')
      and exists(select 1 from public.vehicles where assigned_driver_id = old.profile_id) then
      raise exception 'Unassign the driver from their vehicle first.';
    end if;
  elsif tg_table_name = 'vehicles' then
    if new.assigned_driver_id is not null and not exists(
      select 1 from public.drivers d
      join public.terminal_groups tg on tg.group_id = d.group_id and tg.terminal_id = new.terminal_id
      where d.profile_id = new.assigned_driver_id and d.membership_status = 'approved') then
      raise exception 'Assign an approved driver from one of the terminal groups.';
    end if;
  elsif tg_table_name = 'profiles' then
    if new.role <> old.role then
      if new.role <> 'chairperson' and exists(select 1 from public.groups where chairperson_id = old.id) then
        raise exception 'Reassign the chaired group before changing this role.';
      end if;
      if new.role <> 'driver' and exists(select 1 from public.drivers where profile_id = old.id) then
        raise exception 'Remove the driver membership before changing this role.';
      end if;
    end if;
    new.updated_at = now();
  end if;
  return new;
end;
$$;

-- Correct the schedule visibility rule on databases where the unqualified
-- `terminal_id` in terminal_schedules_public bound to tg.terminal_id instead
-- of the schedule row, leaving the EXISTS uncorrelated. Qualified name keeps
-- the check scoped to the row's own terminal.
drop policy if exists terminal_schedules_public on public.terminal_schedules;
create policy terminal_schedules_public on public.terminal_schedules
  for select to anon, authenticated
  using (
    exists (
      select 1 from public.terminals t
      join public.terminal_groups tg on tg.terminal_id = t.id
      join public.groups g on g.id = tg.group_id
      where t.id = terminal_schedules.terminal_id and t.is_active and g.is_active
    )
  );

alter table public.terminals drop column kind;
