export type ConsoleTab = 'Overview' | 'Terminals' | 'Vehicles' | 'Drivers' | 'Assignments' | 'Updates';
export type MembershipStatus = 'Pending' | 'Approved' | 'Rejected';

export type TerminalRecord = {
  id: string;
  name: string;
  municipality: string;
  barangay: string;
  pin: string;
};

export type TerminalRoster = TerminalRecord & { vehicles: number };

export type VehicleRecord = {
  id: string;
  bodyNumber: string;
  plateNumber: string;
  type: string;
  terminalId: string;
  driverId: string | null;
  status: 'Active' | 'Needs review' | 'Offline';
};

export type DriverRecord = {
  id: string;
  name: string;
  contact: string;
  license: string;
  status: MembershipStatus;
  applied: string;
  decisionAt?: string;
};

export type AnnouncementRecord = {
  id: string;
  title: string;
  body: string;
  time: string;
};

export type TerminalFormState = {
  id: string | null;
  name: string;
  municipality: string;
  barangay: string;
  pin: string;
};

export type VehicleFormState = {
  id: string | null;
  bodyNumber: string;
  plateNumber: string;
  type: string;
  terminalId: string;
  driverId: string | null;
  status: VehicleRecord['status'];
};

export type DriverFilter = 'Applications' | 'Roster' | 'Decisions';
