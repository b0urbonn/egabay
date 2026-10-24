import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { MarinduqueMap } from '../components/MarinduqueMap';
import { RouteCard } from '../components/RouteCard';
import { Badge, ScreenHeader } from '../components/ui';
import { demoRoutes, type CommuteRoute } from '../data/demo';
import type { AppMode } from '../lib/appMode';
import { useColors, useThemeStyles } from '../lib/theme';
import { radius, spacing, type ThemeColors } from '../theme';

function matches(route: CommuteRoute, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (q === '') return true;
  const haystack = `${route.from} ${route.to} ${route.name} ${route.via}`.toLowerCase();
  return q.split(/\s+/).some((word) => haystack.includes(word));
}

export function PlanScreen({ mode }: { mode: AppMode }) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  const [origin, setOrigin] = useState('Boac Town Plaza');
  const [destination, setDestination] = useState('Gasan Town Center');
  const [hasSearched, setHasSearched] = useState(false);

  const results = useMemo(() => {
    if (!hasSearched) return [demoRoutes[0]];
    const found = demoRoutes.filter((route) => matches(route, destination));
    return found.length > 0 ? found : demoRoutes;
  }, [destination, hasSearched]);

  const swap = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  return (
    <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
      <ScreenHeader
        eyebrow="Route finder"
        title={'Plan your\nnext ride.'}
        intro="See a simple route overview for places across Marinduque."
      />
      {mode === 'offline' && (
        <View style={styles.offlineNote}>
          <Text style={styles.offlineNoteText}>Offline mode · results come from saved route data.</Text>
        </View>
      )}
      <View style={styles.plannerCard}>
        <View style={styles.inputRow}>
          <View style={styles.originMark}><View style={styles.originMarkDot} /></View>
          <View style={styles.inputCopy}>
            <Text style={styles.inputLabel}>FROM</Text>
            <TextInput value={origin} onChangeText={setOrigin} style={styles.input} placeholder="Choose your starting point" placeholderTextColor={colors.muted} />
          </View>
        </View>
        <View style={styles.inputConnector} />
        <View style={styles.inputRow}>
          <View style={styles.destinationMark}><View style={styles.destinationMarkDot} /></View>
          <View style={styles.inputCopy}>
            <Text style={styles.inputLabel}>TO</Text>
            <TextInput value={destination} onChangeText={setDestination} style={styles.input} placeholder="Where are you going?" placeholderTextColor={colors.muted} />
          </View>
          <Pressable onPress={swap} style={styles.swapButton} hitSlop={6}>
            <Text style={styles.swapGlyph}>⇅</Text>
          </Pressable>
        </View>
        <Pressable style={({ pressed }) => [styles.searchButton, pressed && styles.pressed]} onPress={() => setHasSearched(true)}>
          <Text style={styles.searchButtonText}>Find a route</Text>
          <Text style={styles.searchButtonArrow}>→</Text>
        </Pressable>
      </View>

      <View style={styles.resultsHeader}>
        <ScreenHeader eyebrow={hasSearched ? 'Results' : 'Suggested'} title={hasSearched ? `${results.length} route${results.length === 1 ? '' : 's'} found` : 'A popular trip'} />
        <View style={styles.badgeWrap}><Badge label="SAMPLE" tone="orange" /></View>
      </View>
      <MarinduqueMap height={200} />
      {results.map((route) => (
        <RouteCard key={route.id} route={route} onPress={() => setHasSearched(true)} />
      ))}
      <View style={styles.tipCard}>
        <Text style={styles.tipGlyph}>✦</Text>
        <View style={styles.tipCopy}>
          <Text style={styles.tipTitle}>A helpful starting point</Text>
          <Text style={styles.tipBody}>Trip suggestions will use confirmed routes and current service information. Live estimates are not connected yet.</Text>
        </View>
      </View>
      <Text style={styles.demoNote}>Sample route only · fares and travel times are not live or verified.</Text>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    pressed: { opacity: 0.82 },
    pageContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 34, gap: 18 },
    offlineNote: { backgroundColor: colors.orangeLight, borderRadius: radius.sm, padding: 11 },
    offlineNoteText: { color: colors.orange, fontSize: 10, fontWeight: '700' },
    plannerCard: { backgroundColor: colors.card, padding: 14, borderRadius: radius.lg, borderColor: colors.line, borderWidth: 1 },
    inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 },
    inputCopy: { flex: 1 },
    inputLabel: { color: colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1.1 },
    input: { color: colors.ink, fontSize: 13, fontWeight: '700', padding: 0, marginTop: 4 },
    originMark: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: colors.green, alignItems: 'center', justifyContent: 'center' },
    originMarkDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green },
    destinationMark: { width: 24, height: 24, borderRadius: 8, backgroundColor: colors.orangeLight, alignItems: 'center', justifyContent: 'center' },
    destinationMarkDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.orange },
    inputConnector: { marginLeft: 11, height: 15, borderLeftWidth: 1.5, borderColor: colors.connector, borderStyle: 'dashed' },
    swapButton: { width: 34, height: 34, borderRadius: 12, borderWidth: 1, borderColor: colors.line, alignItems: 'center', justifyContent: 'center' },
    swapGlyph: { color: colors.green, fontSize: 16, fontWeight: '700' },
    searchButton: { height: 48, borderRadius: radius.md, marginTop: 12, backgroundColor: colors.green, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row' },
    searchButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
    searchButtonArrow: { color: colors.lime, fontSize: 21, fontWeight: '700' },
    resultsHeader: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
    badgeWrap: { marginBottom: 4 },
    tipCard: { flexDirection: 'row', gap: 11, padding: 14, backgroundColor: colors.tipBg, borderRadius: radius.md },
    tipGlyph: { color: colors.green, fontSize: 19, fontWeight: '800' },
    tipCopy: { flex: 1 },
    tipTitle: { color: colors.greenDark, fontSize: 11, fontWeight: '800', marginBottom: 4 },
    tipBody: { color: colors.tipBody, fontSize: 10, lineHeight: 15 },
    demoNote: { color: colors.muted, fontSize: 9, lineHeight: 14, textAlign: 'center', paddingHorizontal: 8 },
  });
}
