import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { CommuteRoute } from '../data/demo';
import { useThemeStyles } from '../lib/theme';
import { radius, type ThemeColors } from '../theme';

export function RouteCard({ route, onPress }: { route: CommuteRoute; onPress?: () => void }) {
  const styles = useThemeStyles(createStyles);
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.routeCard, pressed && styles.pressed]}>
      <View style={styles.routeCardTop}>
        <View style={styles.routeIcon}><Text style={styles.routeIconText}>↗</Text></View>
        <View style={styles.routeStatus}><View style={styles.statusDot} /><Text style={styles.routeStatusText}>{route.status}</Text></View>
      </View>
      <Text style={styles.routeTitle}>{route.name}</Text>
      <Text style={styles.routeVia}>via {route.via}</Text>
      <View style={styles.routeDivider} />
      <View style={styles.routeMetaRow}>
        <Text style={styles.routeMeta}>◷  {route.duration}</Text>
        <Text style={styles.routeMeta}>{route.fare}</Text>
      </View>
      <Text style={styles.routeUnits}>{route.activeUnits} sample units reported nearby</Text>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    pressed: { opacity: 0.82 },
    routeCard: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 15 },
    routeCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
    routeIcon: { width: 34, height: 34, backgroundColor: colors.greenLight, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
    routeIconText: { color: colors.green, fontSize: 18, fontWeight: '700' },
    routeStatus: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.statusBg, paddingHorizontal: 9, paddingVertical: 6, borderRadius: 14, gap: 6 },
    statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.onTime },
    routeStatusText: { color: colors.greenDark, fontSize: 9, fontWeight: '700' },
    routeTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
    routeVia: { color: colors.muted, fontSize: 11, marginTop: 4 },
    routeDivider: { height: 1, backgroundColor: colors.line, marginVertical: 12 },
    routeMetaRow: { flexDirection: 'row', justifyContent: 'space-between' },
    routeMeta: { color: colors.ink, fontSize: 11, fontWeight: '700' },
    routeUnits: { color: colors.muted, fontSize: 10, marginTop: 9 },
  });
}
