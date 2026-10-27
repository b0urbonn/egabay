import { Pressable, Text, View } from 'react-native';

import { Card } from '../../components/ui';
import type { AdminAuditEvent, AdminUser } from '../../types/admin';
import type { Styles } from './styles';
import { ActivityRow, EmptyState, LoadingRows, StatusPill } from './ui';

export function AuditPanel({ events, users, loading, styles, onOpen }: { events: AdminAuditEvent[]; users: Map<string, AdminUser>; loading: boolean; styles: Styles; onOpen: (event: AdminAuditEvent) => void }) {
  return <Card style={styles.listCard}><View style={styles.auditHeading}><View><Text style={styles.panelTitle}>Privileged activity</Text><Text style={styles.panelSubtitle}>Append only records from super admin and chairperson changes</Text></View><StatusPill label="Protected log" tone="green" styles={styles} /></View>
    {loading ? <LoadingRows styles={styles} /> : events.length ? <View style={styles.listRows}>{events.map((event) => <Pressable key={event.id} accessibilityRole="button" accessibilityLabel={`View ${event.action} activity for ${event.table_name}`} onPress={() => onOpen(event)}><ActivityRow event={event} actor={event.actor_id ? users.get(event.actor_id)?.display_name || users.get(event.actor_id)?.email || 'Account' : 'System'} styles={styles} detailed /></Pressable>)}</View> : <EmptyState title="No matching activity" body="Try a different search. New role and registry changes will appear here." styles={styles} />}
  </Card>;
}
