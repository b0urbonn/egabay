import { Text, View } from 'react-native';

import { MaterialIcon } from '../../components/MaterialIcon';
import { Card } from '../../components/ui';
import type { AdminGroup, AdminUser } from '../../types/admin';
import type { Styles } from './styles';
import { EmptyState, ListToolbar, LoadingRows, RecordAction, RegistryHeader, StandbyNotice, StatusPill } from './ui';

export function GroupsPanel({ groups, loading, filter, setFilter, styles, users, onOpen }: { groups: AdminGroup[]; loading: boolean; filter: string; setFilter: (value: string) => void; styles: Styles; users: AdminUser[]; onOpen: (group: AdminGroup) => void }) {
  return <Card style={styles.listCard}>
    <ListToolbar title="Group registry" count={groups.length} filter={filter} setFilter={setFilter} options={['All', 'Active', 'Inactive']} styles={styles} />
    <StandbyNotice styles={styles} text="You can review group records here. Creation and editing will be available in a later release." />
    {loading ? <LoadingRows styles={styles} /> : groups.length ? <View style={styles.listRows}>
      <RegistryHeader labels={['Group / municipality', 'Chairperson']} styles={styles} />
      {groups.map((group) => {
        const chair = users.find((user) => user.id === group.chairperson_id);
        return <View key={group.id} style={styles.dataRow}>
          <View style={styles.rowLeading}><View style={[styles.rowIcon, group.kind === 'toda' ? styles.orangeIcon : styles.greenIcon]}><MaterialIcon name={group.kind === 'toda' ? 'liveTrips' : 'groups'} size={20} color={group.kind === 'toda' ? styles.colors.orangeDark : styles.colors.greenDark} /></View><View style={styles.rowMain}><Text style={styles.rowTitle}>{group.name}</Text><Text style={styles.rowSub}>{group.kind === 'toda' ? 'TODA' : 'Jeepney'} · {group.municipality}</Text></View></View>
          <View style={styles.rowSecondary}>{!styles.wide && <Text style={styles.rowMetaLabel}>Chairperson</Text>}<Text style={styles.rowMeta}>{chair?.display_name || chair?.email || (group.chairperson_id ? 'Assigned account' : 'Not assigned')}</Text></View>
          <View style={styles.statusCell}><StatusPill label={group.is_active ? 'Active' : 'Inactive'} tone={group.is_active ? 'green' : 'neutral'} styles={styles} /></View>
          <RecordAction label={`View ${group.name}`} onPress={() => onOpen(group)} styles={styles} />
        </View>;
      })}
    </View> : <EmptyState title="No matching groups" body="Try a different search or status filter. New groups appear here after registration." styles={styles} />}
  </Card>;
}
