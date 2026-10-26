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

export type TripStatus = 'Approved' | 'Pending' | 'Completed';
export type TripProgressStatus = 'On the way' | 'Boarding' | 'Available' | 'Arrived';

export type TripScheduleType = 'Location-based' | 'Standard schedule';

export type ScheduledTrip = {
  id: string;
  route: string;
  date: string;
  time: string;
  estimatedArrival: string;
  pickup: string;
  destination: string;
  vehicleType: string;
  vehicleNumber: string;
  scheduleType: TripScheduleType;
  estimatedTravelTime: string;
  status: TripStatus;
  progressStatus?: TripProgressStatus;
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

// Sample schedules for the Trips screen. Replace with a user's saved trips when
// trip booking and location services are connected.
export const demoOngoingTrips: ScheduledTrip[] = [
  {
    id: 'trip-boac-gasan',
    route: 'Boac to Gasan',
    date: 'Today',
    time: '9:30 AM',
    estimatedArrival: '10:18 AM',
    pickup: 'Boac Town Plaza',
    destination: 'Gasan Town Center',
    vehicleType: 'Jeepney',
    vehicleNumber: 'MJB 4821',
    scheduleType: 'Location-based',
    estimatedTravelTime: '48 min',
    status: 'Approved',
    progressStatus: 'On the way',
  },
  {
    id: 'trip-boac-santa-cruz',
    route: 'Boac to Santa Cruz',
    date: 'Today',
    time: '10:15 AM',
    estimatedArrival: '11:10 AM',
    pickup: 'Boac Public Market',
    destination: 'Santa Cruz Terminal',
    vehicleType: 'UV Express',
    vehicleNumber: 'MBL 2104',
    scheduleType: 'Standard schedule',
    estimatedTravelTime: '55 min',
    status: 'Approved',
    progressStatus: 'Boarding',
  },
  {
    id: 'trip-boac-mogpog-available',
    route: 'Boac to Mogpog',
    date: 'Today',
    time: '10:30 AM',
    estimatedArrival: '11:05 AM',
    pickup: 'Boac Town Plaza',
    destination: 'Mogpog Public Market',
    vehicleType: 'Jeepney',
    vehicleNumber: 'MJB 6381',
    scheduleType: 'Location-based',
    estimatedTravelTime: '35 min',
    status: 'Pending',
    progressStatus: 'Available',
  },
  {
    id: 'trip-gasan-buenavista-arrived',
    route: 'Gasan to Buenavista',
    date: 'Today',
    time: '11:00 AM',
    estimatedArrival: '11:40 AM',
    pickup: 'Gasan Town Center',
    destination: 'Buenavista Port Area',
    vehicleType: 'Multicab',
    vehicleNumber: 'MCD 3072',
    scheduleType: 'Standard schedule',
    estimatedTravelTime: '40 min',
    status: 'Approved',
    progressStatus: 'Arrived',
  },
];

export const demoTripHistory: ScheduledTrip[] = [
  {
    id: 'trip-boac-mogpog',
    route: 'Boac to Mogpog',
    date: 'Oct 24',
    time: '2:10 PM',
    estimatedArrival: '2:45 PM',
    pickup: 'Boac Town Plaza',
    destination: 'Mogpog Public Market',
    vehicleType: 'Jeepney',
    vehicleNumber: 'MJB 4821',
    scheduleType: 'Standard schedule',
    estimatedTravelTime: '35 min',
    status: 'Completed',
  },
];
