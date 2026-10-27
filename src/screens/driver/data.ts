import type { MaterialIconName } from '../../components/MaterialIcon';
import type { AppearanceSetting } from '../../lib/appearance';
import type { Availability, DriverTab } from './types';

export const tabs: { label: DriverTab; icon: MaterialIconName }[] = [
  { label: 'Home', icon: 'home' },
  { label: 'Updates', icon: 'notifications' },
  { label: 'Profile', icon: 'person' },
];

export const availabilityOptions: Availability[] = ['Available', 'On trip', 'Offline'];

export const appearanceOptions: { value: AppearanceSetting; label: string }[] = [
  { value: 'system', label: 'System' },
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
];

export const groupOptions = ['Boac Central TODA', 'Mogpog TODA', 'Gasan Jeepney Group'];

export const sampleAnnouncements = [
  {
    id: 'a1',
    title: 'Roster check this week',
    body: 'Please confirm your assigned vehicle details with your terminal lead before Friday.',
    meta: 'Oct 24 · Boac Central TODA',
  },
  {
    id: 'a2',
    title: 'Terminal meeting reminder',
    body: 'A group meeting reminder for drivers assigned to Boac Town Center.',
    meta: 'Oct 22 · Boac Central TODA',
  },
];
