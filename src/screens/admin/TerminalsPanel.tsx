import { Text, View } from 'react-native';

import { MaterialIcon } from '../../components/MaterialIcon';
import { Card } from '../../components/ui';
import type { AdminGroup, AdminTerminal } from '../../types/admin';
import type { Styles } from './styles';
import { EmptyState, ListToolbar, LoadingRows, RecordAction, RegistryHeader, StandbyNotice, StatusPill } from './ui';

export function TerminalsPanel({ terminals, groups, loading, filter, setFilter, styles, canAdd, onOpen }: { terminals: AdminTerminal[]; groups: Map<string, AdminGroup>; loading: boolean; filter: string; setFilter: (value: string) => void; styles: Styles; canAdd: boolean; onOpen: (terminal: AdminTerminal) => void }) {
  return <Card style={styles.listCard}>
    <ListToolbar title="Terminal directory" count={terminals.length} filter={filter} setFilter={setFilter} options={['All', 'Active', 'Inactive']} styles={styles} />
    {!canAdd && <StandbyNotice styles={styles} text="An active transport group must exist before you can register a terminal." />}
    {loading ? <LoadingRows styles={styles} /> : terminals.length ? <View style={styles.listRows}>
      <RegistryHeader labels={['Terminal / location', 'Responsible groups']} styles={styles} />
      {terminals.map((terminal) => <View key={terminal.id} style={styles.dataRow}>
        <View style={styles.rowLeading}><View style={styles.rowIcon}><MaterialIcon name="terminals" size={20} color={styles.colors.greenDark} /></View><View style={styles.rowMain}><Text style={styles.rowTitle}>{terminal.name}</Text><Text style={styles.rowSub}>{terminal.barangay}, {terminal.municipality}{terminal.address ? ` · ${terminal.address}` : ''}</Text></View></View>
        <View style={styles.rowSecondary}>{!styles.wide && <Text style={styles.rowMetaLabel}>Responsible groups</Text>}<Text style={styles.rowMeta}>{terminal.group_ids.map((id) => groups.get(id)?.name).filter((name): name is string => Boolean(name)).join(', ') || 'No groups linked'}</Text></View>
        <View style={styles.statusCell}><StatusPill label={terminal.is_active ? 'Active' : 'Inactive'} tone={terminal.is_active ? 'green' : 'neutral'} styles={styles} /></View>
        <RecordAction label={`View ${terminal.name}`} onPress={() => onOpen(terminal)} styles={styles} />
      </View>)}
    </View> : <EmptyState title="No matching terminals" body="Try another search or filter. Registered terminals will appear here." styles={styles} />}
  </Card>;
}
