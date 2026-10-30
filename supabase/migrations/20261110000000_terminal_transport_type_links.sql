-- Terminal transport types become a real many-to-many relationship: the
-- kinds array is replaced by terminal_transport_types, one row per
-- terminal/type pair. Both terminal relationships are junction tables now
-- (terminal_transport_types + terminal_groups); a group link is allowed only
-- when the terminal serves the group's kind.

create table public.terminal_transport_types (
  terminal_id uuid not null references public.terminals(id) on delete cascade,
  kind text not null check (kind in ('toda', 'jeepney')),
  primary key (terminal_id, kind)
);
create index terminal_transport_types_kind_idx on public.terminal_transport_types(kind);

insert into public.terminal_transport_types(terminal_id, kind)
select terminal.id, served.kind
from public.terminals terminal
cross join lateral unnest(terminal.kinds) as served(kind)
on conflict do nothing;

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
  elsif tg_table_name = 'terminal_transport_types' then
    if tg_op = 'DELETE' or (tg_op = 'UPDATE' and (new.kind <> old.kind or new.terminal_id <> old.terminal_id)) then
      if exists(select 1 from public.terminal_groups tg join public.groups g on g.id = tg.group_id
        where tg.terminal_id = old.terminal_id and g.kind = old.kind) then
        raise exception 'Unlink the groups of a transport type before removing it.';
      end if;
    end if;
    if tg_op = 'DELETE' then
      return old;
    end if;
  elsif tg_table_name = 'terminal_groups' then
    if tg_op = 'DELETE' then
      if exists(select 1 from public.vehicles v join public.drivers d on d.profile_id = v.assigned_driver_id
        where v.terminal_id = old.terminal_id and d.group_id = old.group_id) then
        raise exception 'Move the terminal vehicles before unlinking this group.';
      end if;
      return old;
    end if;
    if not exists(select 1 from public.terminal_transport_types tt
      join public.groups g on g.id = new.group_id and tt.kind = g.kind
      where tt.terminal_id = new.terminal_id) then
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

-- The terminal row no longer carries a transport type, so the old kind
-- consistency trigger moves to the junction table itself.
drop trigger validate_terminal_group on public.terminals;
create trigger validate_terminal_type_link before insert or update or delete on public.terminal_transport_types for each row execute function public.validate_group_assignments();

alter table public.terminal_transport_types enable row level security;

-- Served types are public map/directory data; writes mirror terminals_staff:
-- the super admin writes anywhere, a chairperson writes on linked terminals
-- and can freely seed types on a new terminal before linking their group.
create policy terminal_transport_types_public on public.terminal_transport_types for select to anon, authenticated using (true);
create policy terminal_transport_types_staff on public.terminal_transport_types for all to authenticated
  using (public.is_super_admin() or exists(
    select 1 from public.terminal_groups tg
    where tg.terminal_id = terminal_transport_types.terminal_id and tg.group_id = public.chaired_group_id()))
  with check (public.is_super_admin() or public.chaired_group_id() is not null);

revoke all on public.terminal_transport_types from anon, authenticated;
grant select on public.terminal_transport_types to anon, authenticated;
grant insert, update, delete on public.terminal_transport_types to authenticated;

create trigger audit_privileged_write after insert or update or delete on public.terminal_transport_types for each row execute function public.audit_privileged_write();

alter table public.terminals drop column kinds;
