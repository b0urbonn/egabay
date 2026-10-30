-- Jeepneys connect municipalities; TODA routes stay inside one municipality.
-- All existing generated map data remains sample data until confirmed locally.
--
-- These sample-data fixups must stay idempotent: the database test re-runs this
-- file after later migrations apply. Once 20261108 introduced terminal_groups
-- and removed terminals.group_id, the same-kind check switches to the junction
-- table (or the terminal's own kind, which copies the original group kind).
-- Once 20261109 replaces kind with the kinds array, membership is tested with
-- 'jeepney' = any(terminal.kinds) instead; after 20261110 the type rows move
-- to the terminal_transport_types junction.

do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'terminal_transport_types'
  ) then
    update public.terminals terminal
    set name = terminal.municipality || ' Jeepney Terminal (Sample)',
        address = 'Approximate town center; confirm the boarding point locally'
    where terminal.id in (
        'b0000000-0000-4000-8000-000000000001',
        'b0000000-0000-4000-8000-000000000002',
        'b0000000-0000-4000-8000-000000000003',
        'b0000000-0000-4000-8000-000000000004',
        'b0000000-0000-4000-8000-000000000005',
        'b0000000-0000-4000-8000-000000000006'
      )
      and exists (
        select 1 from public.terminal_transport_types tt
        where tt.terminal_id = terminal.id and tt.kind = 'jeepney'
      )
      and terminal.is_sample;
  elsif exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'terminals' and column_name = 'kinds'
  ) then
    update public.terminals terminal
    set name = terminal.municipality || ' Jeepney Terminal (Sample)',
        address = 'Approximate town center; confirm the boarding point locally'
    where terminal.id in (
        'b0000000-0000-4000-8000-000000000001',
        'b0000000-0000-4000-8000-000000000002',
        'b0000000-0000-4000-8000-000000000003',
        'b0000000-0000-4000-8000-000000000004',
        'b0000000-0000-4000-8000-000000000005',
        'b0000000-0000-4000-8000-000000000006'
      )
      and 'jeepney' = any(terminal.kinds)
      and terminal.is_sample;
  elsif exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'terminal_groups'
  ) then
    update public.terminals terminal
    set name = terminal.municipality || ' Jeepney Terminal (Sample)',
        address = 'Approximate town center; confirm the boarding point locally'
    where terminal.id in (
        'b0000000-0000-4000-8000-000000000001',
        'b0000000-0000-4000-8000-000000000002',
        'b0000000-0000-4000-8000-000000000003',
        'b0000000-0000-4000-8000-000000000004',
        'b0000000-0000-4000-8000-000000000005',
        'b0000000-0000-4000-8000-000000000006'
      )
      and terminal.kind = 'jeepney'
      and terminal.is_sample;
  else
    update public.terminals terminal
    set name = terminal.municipality || ' Jeepney Terminal (Sample)',
        address = 'Approximate town center; confirm the boarding point locally'
    from public.groups transport_group
    where terminal.id in (
        'b0000000-0000-4000-8000-000000000001',
        'b0000000-0000-4000-8000-000000000002',
        'b0000000-0000-4000-8000-000000000003',
        'b0000000-0000-4000-8000-000000000004',
        'b0000000-0000-4000-8000-000000000005',
        'b0000000-0000-4000-8000-000000000006'
      )
      and transport_group.id = terminal.group_id
      and transport_group.kind = 'jeepney'
      and terminal.is_sample;
  end if;
end;
$$;

-- Remove only the generated sample routes that send jeepneys to barangays.
update public.routes
set is_active = false
where is_sample
  and mode = 'jeepney'
  and code like 'SAMPLE-JEP-BRG-%';

-- Barangay-level sample service points remain available for TODA routing.
-- The group-kind check works across schema eras: it never reads terminal.kind.
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'terminal_groups'
  ) then
    update public.terminals terminal
    set is_active = false
    where terminal.is_sample
      and terminal.name like 'Sample jeepney service point:%'
      and exists (
        select 1 from public.terminal_groups tg
        join public.groups transport_group on transport_group.id = tg.group_id
        where tg.terminal_id = terminal.id
          and transport_group.is_sample
          and transport_group.kind = 'jeepney'
      );
  else
    update public.terminals terminal
    set is_active = false
    where terminal.is_sample
      and terminal.name like 'Sample jeepney service point:%'
      and exists (
        select 1 from public.groups transport_group
        where transport_group.id = terminal.group_id
          and transport_group.is_sample
          and transport_group.kind = 'jeepney'
      );
  end if;
end;
$$;
