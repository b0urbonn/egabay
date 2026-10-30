import type { AccountRole } from '../lib/session';

export type AdminGroup = { id: string; name: string; kind: 'toda' | 'jeepney'; municipality: string; is_active: boolean; chairperson_id: string | null };
export type AdminTerminal = {
  id: string; group_ids: string[]; kinds: ('toda' | 'jeepney')[]; name: string; municipality: string; barangay: string;
  address: string | null; contact_phone: string | null; latitude: number | null; longitude: number | null; is_active: boolean;
};
export type AdminVehicle = { id: string; terminal_id: string; body_number: string; plate_number: string | null; vehicle_type: 'jeepney' | 'tricycle'; status: string; assigned_driver_id: string | null };
export type AdminDriver = { profile_id: string; group_id: string; membership_status: string; availability: string };
export type AdminUser = { id: string; display_name: string | null; email: string; role: AccountRole; created_at: string };
export type AdminAuditEvent = { id: number; actor_id: string | null; action: string; table_name: string; record_id: string | null; detail: Record<string, unknown>; created_at: string };
export type AdminPanelData = {
  groups: AdminGroup[]; terminals: AdminTerminal[]; vehicles: AdminVehicle[]; drivers: AdminDriver[]; users: AdminUser[]; chairpersons: AdminUser[]; audit: AdminAuditEvent[];
  counts: { groups: number; activeGroups: number; terminals: number; vehicles: number; onTrip: number; drivers: number; pending: number; approved: number; routes: number };
};
