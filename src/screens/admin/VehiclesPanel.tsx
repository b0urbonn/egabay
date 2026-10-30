import { Text, View } from 'react-native';

import { MaterialIcon } from '../../components/MaterialIcon';
import { Card } from '../../components/ui';
import type { AdminGroup, AdminTerminal, AdminUser, AdminVehicle } from '../../types/admin';
import type { Styles } from './styles';
import { EmptyState, ListToolbar, LoadingRows, RecordAction, RegistryHeader, StatusPill } from './ui';

export function VehiclesPanel({ vehicles, terminals, groups, users, loading, filter, setFilter, styles, onOpen }: {
  vehicles: AdminVehicle[]; terminals: Map<string, AdminTerminal>; groups: Map<string, AdminGroup>; users: Map<string, AdminUser>; loading: boolean; filter: string; setFilter: (value: string) => void; styles: Styles; onOpen: (vehicle: AdminVehicle) => void;
}) {
  return <Card style={styles.listCard}>
    <ListToolbar title="Vehicle registry" count={vehicles.length} filter={filter} setFilter={setFilter} options={['All', 'Jeepney', 'Tricycle', 'On trip']} styles={styles} />
    {loading ? <LoadingRows styles={styles} /> : vehicles.length ? <View style={styles.listRows}>
      <RegistryHeader labels={['Vehicle / plate', 'Terminal / driver']} styles={styles} />
      {vehicles.map((vehicle) => {
        const terminal = terminals.get(vehicle.terminal_id);
        const groupNames = terminal ? terminal.group_ids.map((id) => groups.get(id)?.name).filter((name): name is string => Boolean(name)).join(', ') : '';
        const driver = vehicle.assigned_driver_id ? users.get(vehicle.assigned_driver_id) : undefined;
        return <View key={vehicle.id} style={styles.dataRow}>
          <View style={styles.rowLeading}><View style={[styles.rowIcon, vehicle.vehicle_type === 'tricycle' && styles.orangeIcon]}><MaterialIcon name="liveTrips" size={20} color={vehicle.vehicle_type === 'tricycle' ? styles.colors.orangeDark : styles.colors.greenDark} /></View><View style={styles.rowMain}><Text style={styles.rowTitle}>{vehicle.body_number}</Text><Text style={styles.rowSub}>{vehicle.vehicle_type === 'tricycle' ? 'Tricycle' : 'Jeepney'}{vehicle.plate_number ? ` · ${vehicle.plate_number}` : ''}</Text></View></View>
          <View style={styles.rowSecondary}><Text style={styles.rowMeta}>{terminal?.name ?? 'Terminal unavailable'}</Text><Text style={styles.rowSub}>{driver?.display_name ?? (vehicle.assigned_driver_id ? 'Assigned driver' : 'Driver not assigned')} · {groupNames || 'Group unavailable'}</Text></View>
          <View style={styles.statusCell}><StatusPill label={vehicle.status.replaceAll('_', ' ')} tone={vehicle.status === 'on_route' ? 'green' : vehicle.status === 'maintenance' ? 'orange' : 'neutral'} styles={styles} /></View>
          <RecordAction label={`View vehicle ${vehicle.body_number}`} onPress={() => onOpen(vehicle)} styles={styles} />
        </View>;
      })}
    </View> : <EmptyState title="No matching vehicles" body="Try a body number, plate, terminal, or driver name." styles={styles} />}
  </Card>;
}
