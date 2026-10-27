import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { MaterialIcon } from '../../components/MaterialIcon';
import { Button, Card } from '../../components/ui';
import { useColors, useThemeStyles } from '../../lib/theme';
import { createStyles } from './styles';
import type { TerminalRecord, TerminalRoster } from './types';
import { EmptyState, MiniAction, ScreenTitle, SearchField } from './ui';

export function TerminalsTab({
  terminals, expandedId, onExpand, onAdd, onEdit, onRemove, onRoster, onAssignments,
}: {
  terminals: TerminalRoster[];
  expandedId: string | null;
  onExpand: (id: string) => void;
  onAdd: () => void;
  onEdit: (terminal: TerminalRecord) => void;
  onRemove: (id: string) => void;
  onRoster: (id: string) => void;
  onAssignments: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const shownTerminals = terminals.filter((terminal) => `${terminal.name} ${terminal.municipality} ${terminal.barangay}`.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <>
      <ScreenTitle eyebrow="GROUP LOCATIONS" title="Terminals" subtitle="Add locations and keep each group pin current." />
      <SearchField label="Search terminals" value={query} onChange={setQuery} placeholder="Terminal, municipality, or barangay" />
      <Button label="Add terminal" glyph="+" onPress={onAdd} />
      <View style={styles.listSectionHeading}>
        <Text style={styles.listCount}>{terminals.length} TERMINALS</Text>
        <Text style={styles.sampleCount}>Sample records</Text>
      </View>
      {terminals.length === 0 && <EmptyState title="No terminals yet" body="Add your first group terminal with its municipality, barangay, and coordinates." />}
      {terminals.length > 0 && shownTerminals.length === 0 && <EmptyState title="No matching terminals" body="Try a different terminal name or locality." />}
      {shownTerminals.map((terminal) => {
        const expanded = expandedId === terminal.id;
        return <Card key={terminal.id} style={styles.terminalCard}>
          <Pressable onPress={() => onExpand(terminal.id)} style={styles.terminalTop} accessibilityRole="button" accessibilityLabel={`${expanded ? 'Collapse' : 'Expand'} ${terminal.name}`}>
            <View style={styles.terminalIcon}><MaterialIcon name="terminals" size={19} color={colors.green} /></View>
            <View style={styles.terminalCopy}>
              <Text style={styles.terminalName}>{terminal.name}</Text>
              <Text style={styles.terminalLocality}>{terminal.barangay} · {terminal.municipality}</Text>
            </View>
            <View style={styles.vehicleCountBadge}><Text style={styles.vehicleCount}>{terminal.vehicles}</Text><Text style={styles.vehicleCountLabel}>Vehicles</Text></View>
          </Pressable>
          {expanded && <View style={styles.expandedDetails}>
            <View style={styles.detailLine}><MaterialIcon name="location" size={15} color={colors.muted} /><Text style={styles.detailLineText}>{terminal.pin}</Text><Text style={styles.pinLabel}>MAP PIN</Text></View>
            {confirmingId === terminal.id && terminal.vehicles > 0 ? <View style={styles.deleteConfirm}><Text style={styles.deleteConfirmText}>Move all {terminal.vehicles} vehicles to another terminal before removing this location.</Text><Button label="Open assignments" variant="secondary" onPress={onAssignments} /></View> : confirmingId === terminal.id ? <View style={styles.deleteConfirm}>
              <Text style={styles.deleteConfirmText}>Remove this empty terminal?</Text>
              <View style={styles.terminalActions}>
                <Pressable onPress={() => setConfirmingId(null)} style={styles.keepButton}><Text style={styles.keepButtonText}>Keep terminal</Text></Pressable>
                <Pressable onPress={() => { onRemove(terminal.id); setConfirmingId(null); }} style={styles.removeButton}><Text style={styles.removeButtonText}>Remove</Text></Pressable>
              </View>
            </View> : <>
              <View style={styles.terminalActions}>
                <MiniAction label="Edit details" icon="settings" onPress={() => onEdit(terminal)} />
                <MiniAction label="Vehicle roster" icon="liveTrips" onPress={() => onRoster(terminal.id)} />
              </View>
              <Pressable onPress={() => setConfirmingId(terminal.id)} style={styles.removeTerminalLink}><Text style={styles.removeTerminalText}>Remove terminal from preview</Text></Pressable>
            </>}
          </View>}
        </Card>;
      })}
      <Card style={styles.tipCard}>
        <Text style={styles.tipTitle}>Keep terminal details current</Text>
        <Text style={styles.tipBody}>Riders rely on a correct municipality, barangay, and map pin. Confirm each location with your group before publishing.</Text>
      </Card>
    </>
  );
}
