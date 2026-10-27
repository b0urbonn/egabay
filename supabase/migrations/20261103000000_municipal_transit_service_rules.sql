-- Jeepneys connect municipalities; TODA routes stay inside one municipality.
-- All existing generated map data remains sample data until confirmed locally.

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

-- Remove only the generated sample routes that send jeepneys to barangays.
update public.routes
set is_active = false
where is_sample
  and mode = 'jeepney'
  and code like 'SAMPLE-JEP-BRG-%';

-- Barangay-level sample service points remain available for TODA routing.
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
