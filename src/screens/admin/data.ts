import type { MaterialIconName } from '../../components/MaterialIcon';
import type { AccountRole } from '../../lib/session';
import type { AdminPanelData } from '../../types/admin';
import type { Section } from './types';

export const roles: Record<AccountRole, string> = { commuter: 'Commuter', driver: 'Driver', chairperson: 'Chairperson', super_admin: 'Super admin' };

export const sections: { id: Section; label: string; icon: MaterialIconName }[] = [
  { id: 'overview', label: 'Overview', icon: 'home' },
  { id: 'groups', label: 'Transport groups', icon: 'groups' },
  { id: 'terminals', label: 'Terminals', icon: 'terminals' },
  { id: 'vehicles', label: 'Vehicles', icon: 'liveTrips' },
  { id: 'users', label: 'Users & roles', icon: 'person' },
  { id: 'reports', label: 'Reports', icon: 'analytics' },
  { id: 'audit', label: 'Audit log', icon: 'history' },
];

export const municipalities = ['Boac', 'Mogpog', 'Gasan', 'Buenavista', 'Torrijos', 'Santa Cruz'];

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const initialData: AdminPanelData = {
  groups: [], terminals: [], vehicles: [], drivers: [], users: [], chairpersons: [], audit: [],
  counts: { groups: 0, activeGroups: 0, terminals: 0, vehicles: 0, onTrip: 0, drivers: 0, pending: 0, approved: 0, routes: 0 },
};

export const sectionDescription: Record<Section, string> = {
  overview: 'A clear view of groups, terminals, vehicles, and operator accounts across Marinduque.',
  groups: 'Create and edit operator groups, then assign or replace one chairperson per group.',
  terminals: 'Register and maintain confirmed terminals, their responsible group, address, contact details, map pin, and status.',
  vehicles: 'View the island wide vehicle roster, assignment, and current service status.',
  users: 'Review accounts, approve chairperson access by email, and manage the other supported roles.',
  reports: 'Compare verified registry coverage across municipalities and transport types.',
  audit: 'Review privileged changes recorded by the database with actor and timestamp.',
};
