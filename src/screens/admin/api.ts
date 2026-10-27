import { supabase } from '../../lib/supabase';
import type { AdminAuditEvent, AdminPanelData } from '../../types/admin';

export async function loadPanelData(): Promise<AdminPanelData> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const [groups, activeGroups, terminals, vehicles, onTripVehicles, drivers, pendingDrivers, approvedDrivers, users, chairpersons, routes, audit] = await Promise.all([
    supabase.from('groups').select('id,name,kind,municipality,is_active,chairperson_id', { count: 'exact' }).order('name').limit(250),
    supabase.from('groups').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('terminals').select('id,group_id,name,municipality,barangay,address,contact_phone,latitude,longitude,is_active', { count: 'exact' }).order('name').limit(250),
    supabase.from('vehicles').select('id,terminal_id,body_number,plate_number,vehicle_type,status,assigned_driver_id', { count: 'exact' }).order('body_number').limit(250),
    supabase.from('vehicles').select('id', { count: 'exact', head: true }).eq('status', 'on_route'),
    supabase.from('drivers').select('profile_id,group_id,membership_status,availability', { count: 'exact' }).limit(250),
    supabase.from('drivers').select('profile_id', { count: 'exact', head: true }).eq('membership_status', 'pending'),
    supabase.from('drivers').select('profile_id', { count: 'exact', head: true }).eq('membership_status', 'approved'),
    supabase.rpc('admin_user_directory').limit(50),
    supabase.rpc('admin_user_directory').eq('role', 'chairperson').limit(1000),
    supabase.from('routes').select('id', { count: 'exact', head: true }).eq('is_active', true),
    supabase.from('audit_log').select('id,actor_id,action,table_name,record_id,detail,created_at').order('created_at', { ascending: false }).limit(10),
  ]);
  for (const result of [groups, activeGroups, terminals, vehicles, onTripVehicles, drivers, pendingDrivers, approvedDrivers, users, chairpersons, routes, audit]) {
    if (result.error) throw result.error;
  }
  return {
    groups: groups.data ?? [], terminals: terminals.data ?? [], vehicles: vehicles.data ?? [], drivers: drivers.data ?? [],
    users: users.data ?? [], chairpersons: chairpersons.data ?? [], audit: (audit.data ?? []) as AdminAuditEvent[],
    counts: {
      groups: groups.count ?? 0, activeGroups: activeGroups.count ?? 0, terminals: terminals.count ?? 0,
      vehicles: vehicles.count ?? 0, onTrip: onTripVehicles.count ?? 0, drivers: drivers.count ?? 0,
      pending: pendingDrivers.count ?? 0, approved: approvedDrivers.count ?? 0, routes: routes.count ?? 0,
    },
  };
}

export function errorMessage(cause: unknown): string {
  if (typeof cause === 'string' && cause.trim()) return cause.trim();
  if (typeof cause === 'object' && cause !== null) {
    const error = cause as { message?: unknown; code?: unknown; details?: unknown; hint?: unknown };
    const parts = [
      typeof error.message === 'string' && error.message.trim() ? error.message.trim() : null,
      typeof error.code === 'string' && error.code.trim() ? `Code: ${error.code.trim()}` : null,
      typeof error.details === 'string' && error.details.trim() ? `Details: ${error.details.trim()}` : null,
      typeof error.hint === 'string' && error.hint.trim() ? `Hint: ${error.hint.trim()}` : null,
    ].filter((part): part is string => part !== null);
    if (parts.length) return parts.join('\n');
  }
  return 'The request could not be completed. Check your connection and try again.';
}

export function shortDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? 'Recently' : date.toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' });
}

export function initials(value: string): string {
  return value.split(/[\s@.]+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('') || 'A';
}
