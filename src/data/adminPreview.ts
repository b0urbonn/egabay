import type { AccountSession } from '../lib/session';
import type { AdminPanelData } from '../types/admin';

// Fictional design fixtures. Never sent to Supabase or used to authorize an account.
export const adminPreviewAccount: AccountSession = {
  kind: 'account', id: 'design-admin', name: 'Alex Rivera', email: 'alex@example.test', role: 'super_admin', photoUrl: null,
};

export function createAdminPreviewData(): AdminPanelData {
  const created_at = '2026-10-26T06:00:00Z';
  return {
    groups: [
      { id: 'g1', name: 'Sample Boac Jeepney Cooperative', kind: 'jeepney', municipality: 'Boac', is_active: true, chairperson_id: 'u1' },
      { id: 'g2', name: 'Sample Santa Cruz TODA', kind: 'toda', municipality: 'Santa Cruz', is_active: true, chairperson_id: 'u2' },
      { id: 'g3', name: 'Sample Gasan Transport Group', kind: 'jeepney', municipality: 'Gasan', is_active: true, chairperson_id: null },
      { id: 'g4', name: 'Sample Mogpog TODA', kind: 'toda', municipality: 'Mogpog', is_active: false, chairperson_id: null },
    ],
    terminals: [
      { id: 't1', group_id: 'g1', name: 'Sample Boac Central Terminal', municipality: 'Boac', barangay: 'Sample town center', is_active: true },
      { id: 't2', group_id: 'g2', name: 'Sample Santa Cruz Terminal', municipality: 'Santa Cruz', barangay: 'Sample market area', is_active: true },
      { id: 't3', group_id: 'g3', name: 'Sample Gasan Terminal', municipality: 'Gasan', barangay: 'Sample town center', is_active: true },
      { id: 't4', group_id: 'g4', name: 'Sample Mogpog Terminal', municipality: 'Mogpog', barangay: 'Sample market area', is_active: false },
    ],
    vehicles: [
      { id: 'v1', terminal_id: 't1', body_number: 'DEMO-J01', plate_number: 'SAMPLE 001', vehicle_type: 'jeepney', status: 'on_route', assigned_driver_id: 'd1' },
      { id: 'v2', terminal_id: 't1', body_number: 'DEMO-J02', plate_number: 'SAMPLE 002', vehicle_type: 'jeepney', status: 'available', assigned_driver_id: 'd2' },
      { id: 'v3', terminal_id: 't2', body_number: 'DEMO-T01', plate_number: 'SAMPLE 003', vehicle_type: 'tricycle', status: 'on_route', assigned_driver_id: 'd3' },
      { id: 'v4', terminal_id: 't3', body_number: 'DEMO-J03', plate_number: 'SAMPLE 004', vehicle_type: 'jeepney', status: 'maintenance', assigned_driver_id: null },
    ],
    drivers: [
      { profile_id: 'd1', group_id: 'g1', membership_status: 'approved', availability: 'on_trip' },
      { profile_id: 'd2', group_id: 'g1', membership_status: 'approved', availability: 'available' },
      { profile_id: 'd3', group_id: 'g2', membership_status: 'approved', availability: 'on_trip' },
      { profile_id: 'd4', group_id: 'g2', membership_status: 'pending', availability: 'offline' },
    ],
    users: [
      { id: 'design-admin', display_name: 'Alex Rivera', email: 'alex@example.test', role: 'super_admin', created_at },
      { id: 'u1', display_name: 'Jamie Santos', email: 'jamie@example.test', role: 'chairperson', created_at },
      { id: 'u2', display_name: 'Morgan Cruz', email: 'morgan@example.test', role: 'chairperson', created_at },
      { id: 'u3', display_name: 'Taylor Reyes', email: 'taylor@example.test', role: 'chairperson', created_at },
      ...['Robin Garcia', 'Sam Flores', 'Casey Ramos', 'Drew Mendoza'].map((display_name, index) => ({ id: `d${index + 1}`, display_name, email: `driver${index + 1}@example.test`, role: 'driver' as const, created_at })),
      { id: 'u4', display_name: 'Jordan Aquino', email: 'jordan@example.test', role: 'commuter', created_at },
    ],
    audit: [
      { id: 3, actor_id: 'design-admin', action: 'UPDATE', table_name: 'groups', record_id: 'g1', detail: { name: 'Sample Boac Jeepney Cooperative', change: 'Chairperson assigned' }, created_at: '2026-10-26T06:30:00Z' },
      { id: 2, actor_id: 'u2', action: 'INSERT', table_name: 'vehicles', record_id: 'v3', detail: { body_number: 'DEMO-T01', change: 'Vehicle registered' }, created_at: '2026-10-26T06:15:00Z' },
      { id: 1, actor_id: 'design-admin', action: 'INSERT', table_name: 'groups', record_id: 'g3', detail: { name: 'Sample Gasan Transport Group' }, created_at: '2026-10-26T06:00:00Z' },
    ],
    counts: { groups: 4, activeGroups: 3, terminals: 4, vehicles: 4, onTrip: 2, drivers: 4, pending: 1, approved: 3, routes: 0 },
  };
}
