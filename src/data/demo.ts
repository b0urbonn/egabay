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
  {
    id: 'boac-mogpog',
    name: 'Boac to Mogpog',
    from: 'Boac Town Plaza',
    to: 'Mogpog Public Market',
    via: 'Isok · Bintakay',
    duration: '35 min',
    fare: '₱40–₱55',
    activeUnits: 4,
    status: 'On time',
  },
  {
    id: 'gasan-buenavista',
    name: 'Gasan to Buenavista',
    from: 'Gasan Town Center',
    to: 'Buenavista Port Area',
    via: 'Bahi · Tapuyan',
    duration: '40 min',
    fare: '₱50–₱65',
    activeUnits: 2,
    status: 'On time',
  },
  {
    id: 'boac-torrijos',
    name: 'Boac to Torrijos',
    from: 'Boac Public Market',
    to: 'Torrijos Terminal',
    via: 'Cawit · Malbog · Maranlig',
    duration: '1 hr 30 min',
    fare: '₱110–₱140',
    activeUnits: 1,
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
  {
    id: 'holiday-trips',
    title: 'Additional trips this weekend',
    detail: 'Operators plan extra jeepney and tricycle runs for the town fiesta.',
    locality: 'Santa Cruz',
    time: 'Updated 3 hrs ago',
    severity: 'info',
  },
  {
    id: 'rough-road',
    title: 'Rough road section reported',
    detail: 'Expect a slower stretch between Maranlig and Torrijos after the heavy rain.',
    locality: 'Torrijos',
    time: 'Updated 5 hrs ago',
    severity: 'notice',
  },
];
