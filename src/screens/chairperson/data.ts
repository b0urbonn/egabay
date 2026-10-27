import type { MaterialIconName } from '../../components/MaterialIcon';
import type {
  AnnouncementRecord,
  ConsoleTab,
  DriverRecord,
  TerminalRecord,
  VehicleRecord,
} from './types';

export const initialTerminals: TerminalRecord[] = [
  { id: 't1', name: 'Boac Town Center', municipality: 'Boac', barangay: 'Demo barangay 1', pin: '13.4460, 121.8400' },
  { id: 't2', name: 'Mogpog Market Stop', municipality: 'Mogpog', barangay: 'Demo barangay 2', pin: '13.4700, 121.8600' },
  { id: 't3', name: 'Gasan Crossing', municipality: 'Gasan', barangay: 'Demo barangay 3', pin: '13.3230, 121.8500' },
];

export const initialDrivers: DriverRecord[] = [
  { id: 'd1', name: 'Alex Reyes', contact: '09•• ••• 1427', license: 'XX•••••81', status: 'Pending', applied: 'Today' },
  { id: 'd2', name: 'Jamie Cruz', contact: '09•• ••• 6304', license: 'XX•••••26', status: 'Pending', applied: 'Yesterday' },
  { id: 'd3', name: 'Mika Santos', contact: '09•• ••• 2086', license: 'XX•••••53', status: 'Approved', applied: 'Oct 18' },
  { id: 'd4', name: 'Noel Dizon', contact: '09•• ••• 9150', license: 'XX•••••09', status: 'Approved', applied: 'Oct 11' },
  { id: 'd5', name: 'Ria Mendoza', contact: '09•• ••• 7721', license: 'XX•••••64', status: 'Approved', applied: 'Oct 06' },
];

export const initialVehicles: VehicleRecord[] = [
  { id: 'v1', bodyNumber: 'BC-014', plateNumber: 'SAMPLE-014', type: 'Tricycle', terminalId: 't1', driverId: 'd3', status: 'Active' },
  { id: 'v2', bodyNumber: 'BC-021', plateNumber: 'SAMPLE-021', type: 'Tricycle', terminalId: 't1', driverId: 'd4', status: 'Active' },
  { id: 'v3', bodyNumber: 'BC-032', plateNumber: 'SAMPLE-032', type: 'Tricycle', terminalId: 't2', driverId: null, status: 'Needs review' },
  { id: 'v4', bodyNumber: 'BC-045', plateNumber: 'SAMPLE-045', type: 'Jeepney', terminalId: 't3', driverId: null, status: 'Offline' },
];

export const initialAnnouncements: AnnouncementRecord[] = [
  { id: 'a1', title: 'Roster check this week', body: 'Please confirm your vehicle details with the terminal lead before Friday.', time: 'Sample · Oct 24' },
];

export const tabIcons: Record<ConsoleTab, MaterialIconName> = {
  Overview: 'home',
  Terminals: 'terminals',
  Vehicles: 'liveTrips',
  Drivers: 'person',
  Assignments: 'route',
  Updates: 'notifications',
};

export const consoleTabs: ConsoleTab[] = ['Overview', 'Terminals', 'Vehicles', 'Drivers', 'Assignments', 'Updates'];
