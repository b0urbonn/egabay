import { Pressable, Text, View } from 'react-native';

import { Button, Card, TextField } from '../../components/ui';
import { accountRoles, type AccountRole } from '../../lib/session';
import type { AdminUser } from '../../types/admin';
import { initials } from './api';
import { roles } from './data';
import type { Styles } from './styles';
import { EmptyState, ListToolbar, LoadingRows } from './ui';

export function UsersPanel({ users, loading, filter, setFilter, choices, setChoices, saving, saveRole, chairEmail, chairEmailError, onChairEmail, onApproveChair, approvingChair, styles }: {
  users: AdminUser[]; loading: boolean; filter: string; setFilter: (value: string) => void; choices: Record<string, AccountRole>; setChoices: (update: (current: Record<string, AccountRole>) => Record<string, AccountRole>) => void; saving: string | null; saveRole: (user: AdminUser) => Promise<void>;
  chairEmail: string; chairEmailError: string | null; onChairEmail: (value: string) => void; onApproveChair: () => void; approvingChair: boolean; styles: Styles;
}) {
  return <>
    <Card style={styles.listCard}>
      <Text style={styles.panelTitle}>Approve a chairperson</Text>
      <Text style={styles.panelSubtitle}>Enter the email of an existing account to grant chairperson access. A group is assigned separately in the group registry.</Text>
      <View style={styles.chairForm}>
        <View style={styles.chairField}><TextField comfortable label="Chairperson email" value={chairEmail} onChangeText={onChairEmail} placeholder="name@example.com" error={chairEmailError} autoCapitalize="none" keyboardType="email-address" /></View>
        <Button label="Approve chairperson" onPress={onApproveChair} loading={approvingChair} disabled={approvingChair || saving !== null} />
      </View>
    </Card>
    <Card style={styles.listCard}><ListToolbar title="User access" count={users.length} filter={filter} setFilter={setFilter} options={['All', ...accountRoles.map((role) => roles[role])]} styles={styles} />
      <Text style={styles.panelSubtitle}>Showing the latest 50 accounts. New sign-ins begin with commuter access. Chairperson access is approved by email above; demote an existing chairperson from their row. Driver and chairperson roles still need a group assignment.</Text>
      {loading ? <LoadingRows styles={styles} /> : users.length ? <View style={styles.listRows}>{users.map((user) => <View key={user.id} style={styles.userRow}><View style={styles.rowLeading}><View style={styles.userAvatar}><Text style={styles.userAvatarText}>{initials(user.display_name || user.email)}</Text></View><View style={styles.rowMain}><Text style={styles.rowTitle}>{user.display_name || 'Unnamed account'}</Text><Text style={styles.rowSub}>{user.email}</Text></View></View><View style={styles.userRoleOptions}>{accountRoles.map((role) => {
        if (role === 'chairperson' && user.role !== 'chairperson') return null;
        const locked = role === 'chairperson';
        const selected = (choices[user.id] ?? user.role) === role;
        return <Pressable key={role} accessibilityRole="button" accessibilityLabel={locked ? `${roles[role]} role for ${user.email}, granted by email approval` : `${roles[role]} role for ${user.email}`} accessibilityState={{ selected, disabled: locked || saving !== null }} disabled={locked || saving !== null} onPress={() => setChoices((current) => ({ ...current, [user.id]: role }))} style={[styles.roleOption, selected && styles.roleSelected, locked && styles.roleLocked]}><Text style={[styles.roleOptionText, selected && styles.roleOptionTextSelected]}>{roles[role]}</Text></Pressable>;
      })}</View>{choices[user.id] && choices[user.id] !== user.role && <Button label="Review change" onPress={() => void saveRole(user)} loading={saving === user.id} disabled={saving !== null && saving !== user.id} style={styles.saveRoleButton} />}</View>)}</View> : <EmptyState title="No accounts found" body="Try a different search or role filter." styles={styles} />}
    </Card>
  </>;
}
