export type CommuteRoute = {
  id: string;
  name: string;
  from: string;
  to: string;
  via: string;
  duration: string;
  fare: string;
  activeUnits: number;
  status: 'On time' | 'Limited units';
};

export type ServiceAlert = {
  id: string;
  title: string;
  detail: string;
  locality: string;
  time: string;
  severity: 'info' | 'notice';
};

// Replace these samples with Supabase data after localities, routes, and fares
// have been confirmed with transport operators.
export const demoRoutes: CommuteRoute[] = [
  {
    id: 'boac-gasan',
    name: 'Boac to Gasan',
    from: 'Boac Town Plaza',
    to: 'Gasan Town Center',
    via: 'Tugos · Laylay · Bunganay',
    duration: '48 min',
    fare: '₱60–₱75',
    activeUnits: 3,
    status: 'On time',
  },
  {
    id: 'boac-santa-cruz',
    name: 'Boac to Santa Cruz',
    from: 'Boac Public Market',
    to: 'Santa Cruz Terminal',
    via: 'Capayang · Bangcuangan',
    duration: '55 min',
    fare: '₱70–₱90',
    activeUnits: 2,
    status: 'Limited units',
  },
];

export const demoAlerts: ServiceAlert[] = [
  {
    id: 'roadworks',
    title: 'Allow extra travel time near Laylay',
    detail: 'Road works may slow trips heading south this afternoon.',
    locality: 'Boac',
    time: 'Updated 20 min ago',
    severity: 'notice',
  },
  {
    id: 'schedule',
    title: 'Regular service is running',
    detail: 'The Boac–Gasan route is operating on its usual schedule.',
    locality: 'Boac · Gasan',
    time: 'Updated 1 hr ago',
    severity: 'info',
  },
];
