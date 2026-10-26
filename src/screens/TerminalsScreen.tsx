import { useEffect, useMemo, useState } from 'react';
import { BackHandler, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { MaterialIcon } from '../components/MaterialIcon';
import { MarinduqueMap } from '../components/MarinduqueMap';
import { demoOngoingTrips, demoRoutes, type CommuteRoute } from '../data/demo';
import { useColors, useThemeStyles } from '../lib/theme';
import type { ThemeColors } from '../theme';

type Municipality = 'Santa Cruz' | 'Boac' | 'Mogpog' | 'Buenavista' | 'Torrijos' | 'Gasan';

type Terminal = {
  id: string;
  name: string;
  municipality: Municipality;
  address: string;
  routeIds: string[];
};

const localities = ['All', 'Santa Cruz', 'Boac', 'Mogpog', 'Buenavista', 'Torrijos', 'Gasan'] as const;
type LocalityFilter = (typeof localities)[number];

// Sample land transport hubs based on the towns and endpoints in the app's
// route data. Replace these approximate locations with verified terminal data.
const terminals: Terminal[] = [
  {
    id: 'santa-cruz',
    name: 'Santa Cruz Transport Terminal',
    municipality: 'Santa Cruz',
    address: 'Town center · Santa Cruz, Marinduque',
    routeIds: ['boac-santa-cruz'],
  },
  {
    id: 'boac',
    name: 'Boac Transport Terminal',
    municipality: 'Boac',
    address: 'Town center · Boac, Marinduque',
    routeIds: ['boac-gasan', 'boac-santa-cruz', 'boac-mogpog', 'boac-torrijos'],
  },
  {
    id: 'mogpog',
    name: 'Mogpog Transport Terminal',
    municipality: 'Mogpog',
    address: 'Town center · Mogpog, Marinduque',
    routeIds: ['boac-mogpog'],
  },
  {
    id: 'buenavista',
    name: 'Buenavista Transport Terminal',
    municipality: 'Buenavista',
    address: 'Town center · Buenavista, Marinduque',
    routeIds: ['gasan-buenavista'],
  },
  {
    id: 'torrijos',
    name: 'Torrijos Transport Terminal',
    municipality: 'Torrijos',
    address: 'Town center · Torrijos, Marinduque',
    routeIds: ['boac-torrijos'],
  },
  {
    id: 'gasan',
    name: 'Gasan Transport Terminal',
    municipality: 'Gasan',
    address: 'Town center · Gasan, Marinduque',
    routeIds: ['boac-gasan', 'gasan-buenavista'],
  },
];

export function TerminalsScreen({ onBack }: { onBack: () => void }) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<LocalityFilter>('All');
  const [selectedTerminal, setSelectedTerminal] = useState<Terminal | null>(null);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (selectedTerminal) setSelectedTerminal(null);
      else onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack, selectedTerminal]);

  const visibleTerminals = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return terminals.filter((terminal) => {
      const matchesLocality = activeFilter === 'All' || terminal.municipality === activeFilter;
      const matchesQuery = !query || `${terminal.name} ${terminal.municipality} ${terminal.address}`.toLowerCase().includes(query);
      return matchesLocality && matchesQuery;
    });
  }, [activeFilter, searchQuery]);

  return selectedTerminal ? (
    <TerminalDetails terminal={selectedTerminal} onBack={() => setSelectedTerminal(null)} />
  ) : (
    <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to Home"
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <MaterialIcon name="arrowBack" size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>GETTING AROUND</Text>
          <Text style={styles.title}>Terminals</Text>
        </View>
      </View>

      <View style={styles.searchField}>
        <MaterialIcon name="search" size={21} color={colors.greenDark} />
        <TextInput
          accessibilityLabel="Search terminals"
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search terminal or municipality"
          placeholderTextColor={colors.muted}
          returnKeyType="search"
          style={styles.searchInput}
        />
        {searchQuery.length > 0 && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={() => setSearchQuery('')}
            hitSlop={8}
          >
            <Text style={styles.clearSearch}>Clear</Text>
          </Pressable>
        )}
      </View>

      <ScrollView horizontal contentContainerStyle={styles.filterList} showsHorizontalScrollIndicator={false}>
        {localities.map((locality) => {
          const selected = activeFilter === locality;
          return (
            <Pressable
              key={locality}
              accessibilityRole="button"
              accessibilityLabel={`Filter terminals by ${locality}`}
              accessibilityState={{ selected }}
              onPress={() => setActiveFilter(locality)}
              style={[styles.filterChip, selected && styles.filterChipSelected]}
            >
              <Text style={[styles.filterText, selected && styles.filterTextSelected]}>{locality}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <View style={styles.listHeading}>
        <Text style={styles.sectionTitle}>{activeFilter === 'All' ? 'Nearby terminals' : `${activeFilter} terminals`}</Text>
        <Text style={styles.countText}>{visibleTerminals.length} listed</Text>
      </View>

      {visibleTerminals.length ? (
        <View style={styles.terminalList}>
          {visibleTerminals.map((terminal) => (
            <Pressable
              key={terminal.id}
              accessibilityRole="button"
              accessibilityLabel={`View details for ${terminal.name}`}
              onPress={() => setSelectedTerminal(terminal)}
              style={({ pressed }) => [styles.terminalCard, pressed && styles.cardPressed]}
            >
              <View style={styles.terminalIcon}>
              <MaterialIcon name="terminals" size={21} color={colors.greenDark} />
              </View>
              <View style={styles.terminalCopy}>
                <Text style={styles.terminalName}>{terminal.name}</Text>
                <Text style={styles.terminalAddress}>{terminal.address}</Text>
                <View style={styles.detailsLink}>
                  <Text style={styles.detailsText}>View Details</Text>
                  <MaterialIcon name="chevronRight" size={16} color={colors.greenDark} />
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={styles.emptyCard}>
          <View style={styles.emptyIcon}><MaterialIcon name="terminals" size={23} color={colors.muted} /></View>
          <Text style={styles.emptyTitle}>No terminals listed here yet</Text>
          <Text style={styles.emptyCopy}>Try another municipality or search for a different terminal.</Text>
        </View>
      )}

      <Text style={styles.dataNote}>Sample transport hubs · exact terminal locations need confirmation.</Text>
    </ScrollView>
  );
}

function TerminalDetails({ terminal, onBack }: { terminal: Terminal; onBack: () => void }) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  const [activeMode, setActiveMode] = useState<'Jeepney' | 'Tricycle'>('Jeepney');
  const jeepneyRouteNames = new Set(demoOngoingTrips.filter((trip) => trip.vehicleType === 'Jeepney').map((trip) => trip.route));
  const servedRoutes = demoRoutes.filter((route) => terminal.routeIds.includes(route.id) && jeepneyRouteNames.has(route.name));

  return (
    <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Back to terminals"
          onPress={onBack}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
        >
          <MaterialIcon name="arrowBack" size={22} color={colors.ink} />
        </Pressable>
        <View style={styles.headingCopy}>
          <Text style={styles.eyebrow}>{terminal.municipality.toUpperCase()}</Text>
          <Text style={styles.title}>Terminal details</Text>
        </View>
      </View>

      <View style={styles.detailTitleBlock}>
        <Text style={styles.detailTitle}>{terminal.name}</Text>
        <View style={styles.addressRow}>
          <MaterialIcon name="location" size={17} color={colors.greenDark} />
          <Text style={styles.addressText}>{terminal.address}</Text>
        </View>
      </View>

      <View style={styles.mapCard}>
        <Text style={styles.sectionTitle}>Map</Text>
        <View style={styles.mapWrap}>
          <MarinduqueMap height={190} />
        </View>
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.sectionTitle}>Contact information</Text>
        <View style={styles.infoCard}>
          <View style={styles.infoIcon}><MaterialIcon name="phone" size={19} color={colors.greenDark} /></View>
          <View style={styles.infoCopy}>
            <Text style={styles.infoLabel}>Phone</Text>
            <Text style={styles.infoValue}>No public contact listed</Text>
          </View>
        </View>
        <Text style={styles.helperText}>Contact information has not been confirmed yet.</Text>
      </View>

      <View style={styles.detailSection}>
        <Text style={styles.sectionTitle}>Routes served</Text>
        <View style={styles.modeSwitch}>
          {(['Jeepney', 'Tricycle'] as const).map((mode) => {
            const selected = activeMode === mode;
            return (
              <Pressable
                key={mode}
                accessibilityRole="button"
                accessibilityLabel={`Show ${mode} routes`}
                accessibilityState={{ selected }}
                onPress={() => setActiveMode(mode)}
                style={[styles.modeButton, selected && styles.modeButtonSelected]}
              >
                <Text style={[styles.modeText, selected && styles.modeTextSelected]}>{mode}</Text>
              </Pressable>
            );
          })}
        </View>
        {activeMode === 'Jeepney' && servedRoutes.length > 0 ? (
          <View style={styles.servedRoutes}>
            {servedRoutes.map((route, index) => (
              <View key={route.id}>
                {index > 0 && <View style={styles.routeSeparator} />}
                <RouteRow route={route} styles={styles} />
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.routeEmptyCard}>
            <View style={styles.infoIcon}><MaterialIcon name="route" size={19} color={colors.greenDark} /></View>
            <View style={styles.infoCopy}>
              <Text style={styles.infoValue}>{activeMode === 'Tricycle' ? 'Tricycle routes are not mapped yet' : 'No sample routes listed'}</Text>
              <Text style={styles.routeEmptyCopy}>Route paths and schedules need confirmation from local operators.</Text>
            </View>
          </View>
        )}
      </View>
      <Text style={styles.dataNote}>Sample route data. Confirm pickup points, routes, and schedules locally before traveling.</Text>
    </ScrollView>
  );
}

function RouteRow({ route, styles }: { route: CommuteRoute; styles: ReturnType<typeof createStyles> }) {
  const colors = useColors();
  return (
    <View style={styles.routeRow}>
      <View style={styles.routeIcon}><MaterialIcon name="route" size={18} color={colors.greenDark} /></View>
      <View style={styles.infoCopy}>
        <Text style={styles.routeName}>{route.name}</Text>
        <Text style={styles.routePath}>{route.from}  →  {route.to.replace(/\s*Port Area$/i, '')}</Text>
        <Text style={styles.routeMeta}>{route.via}  ·  {route.duration}  ·  {route.fare}</Text>
        <Text style={styles.sampleLabel}>Sample jeepney route</Text>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    pageContent: { paddingHorizontal: 20, paddingTop: 17, paddingBottom: 28 },
    header: { minHeight: 52, flexDirection: 'row', alignItems: 'center', marginBottom: 18 },
    backButton: { width: 42, height: 42, marginRight: 12, borderRadius: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' },
    headingCopy: { flex: 1 },
    eyebrow: { color: colors.muted, fontSize: 10, lineHeight: 13, fontWeight: '800', letterSpacing: 1 },
    title: { marginTop: 1, color: colors.ink, fontSize: 23, lineHeight: 29, fontWeight: '800', letterSpacing: -0.45 },
    searchField: { height: 51, paddingHorizontal: 14, borderWidth: 1, borderColor: colors.line, borderRadius: 16, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center' },
    searchInput: { flex: 1, height: '100%', marginLeft: 10, paddingVertical: 0, color: colors.ink, fontSize: 13, lineHeight: 18 },
    clearSearch: { color: colors.greenDark, fontSize: 12, fontWeight: '700', paddingLeft: 8 },
    filterList: { gap: 8, paddingVertical: 15, paddingRight: 20 },
    filterChip: { minHeight: 35, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
    filterChipSelected: { borderColor: colors.green, backgroundColor: colors.green },
    filterText: { color: colors.muted, fontSize: 12, lineHeight: 16, fontWeight: '700' },
    filterTextSelected: { color: '#FFFFFF' },
    listHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11, marginTop: 1 },
    sectionTitle: { color: colors.ink, fontSize: 18, lineHeight: 23, fontWeight: '800', letterSpacing: -0.25 },
    countText: { color: colors.muted, fontSize: 11, lineHeight: 15, fontWeight: '600' },
    terminalList: { gap: 10 },
    terminalCard: { minHeight: 113, padding: 14, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'flex-start' },
    terminalIcon: { width: 43, height: 43, borderRadius: 14, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
    terminalCopy: { flex: 1, minHeight: 83 },
    terminalName: { color: colors.ink, fontSize: 14, lineHeight: 19, fontWeight: '800' },
    terminalAddress: { marginTop: 3, color: colors.muted, fontSize: 12, lineHeight: 17 },
    detailsLink: { flexDirection: 'row', alignItems: 'center', marginTop: 8, alignSelf: 'flex-start' },
    detailsText: { color: colors.greenDark, fontSize: 12, lineHeight: 16, fontWeight: '800' },
    cardPressed: { backgroundColor: colors.selectedCardBg, opacity: 0.8 },
    emptyCard: { alignItems: 'center', paddingHorizontal: 24, paddingVertical: 28, borderRadius: 18, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
    emptyIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: colors.chipBg, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
    emptyTitle: { color: colors.ink, fontSize: 14, lineHeight: 19, fontWeight: '800', textAlign: 'center' },
    emptyCopy: { color: colors.muted, fontSize: 12, lineHeight: 17, textAlign: 'center', marginTop: 5 },
    dataNote: { color: colors.muted, fontSize: 10, lineHeight: 14, textAlign: 'center', marginTop: 16, paddingHorizontal: 8 },
    detailTitleBlock: { marginBottom: 17 },
    detailTitle: { color: colors.ink, fontSize: 22, lineHeight: 28, fontWeight: '800', letterSpacing: -0.45 },
    addressRow: { flexDirection: 'row', alignItems: 'center', marginTop: 7, gap: 5 },
    addressText: { flex: 1, color: colors.muted, fontSize: 12, lineHeight: 17 },
    mapCard: { padding: 14, borderRadius: 19, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
    mapWrap: { marginTop: 11, borderRadius: 14, overflow: 'hidden' },
    detailSection: { marginTop: 21 },
    infoCard: { minHeight: 68, flexDirection: 'row', alignItems: 'center', marginTop: 10, padding: 13, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
    modeSwitch: { flexDirection: 'row', gap: 8, marginTop: 11, marginBottom: 10 },
    modeButton: { minHeight: 34, paddingHorizontal: 14, borderRadius: 17, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, justifyContent: 'center' },
    modeButtonSelected: { borderColor: colors.green, backgroundColor: colors.green },
    modeText: { color: colors.muted, fontSize: 12, lineHeight: 16, fontWeight: '700' },
    modeTextSelected: { color: '#FFFFFF' },
    servedRoutes: { borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card, overflow: 'hidden' },
    routeRow: { minHeight: 91, flexDirection: 'row', alignItems: 'flex-start', paddingHorizontal: 12, paddingVertical: 12 },
    routeIcon: { width: 36, height: 36, borderRadius: 12, marginRight: 10, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
    routeName: { color: colors.ink, fontSize: 13, lineHeight: 18, fontWeight: '800' },
    routePath: { color: colors.ink, fontSize: 11, lineHeight: 15, marginTop: 3 },
    routeMeta: { color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 2 },
    sampleLabel: { color: colors.greenDark, fontSize: 9, lineHeight: 12, fontWeight: '800', marginTop: 3 },
    routeSeparator: { height: StyleSheet.hairlineWidth, backgroundColor: colors.line, marginLeft: 58 },
    routeEmptyCard: { minHeight: 83, flexDirection: 'row', alignItems: 'flex-start', padding: 13, borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.card },
    infoIcon: { width: 40, height: 40, borderRadius: 13, marginRight: 11, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
    infoCopy: { flex: 1 },
    infoLabel: { color: colors.muted, fontSize: 11, lineHeight: 15, fontWeight: '600' },
    infoValue: { color: colors.ink, fontSize: 13, lineHeight: 18, fontWeight: '700', marginTop: 2 },
    helperText: { color: colors.muted, fontSize: 11, lineHeight: 15, marginTop: 7, marginLeft: 2 },
    routeEmptyCopy: { color: colors.muted, fontSize: 11, lineHeight: 15, marginTop: 4 },
    pressed: { opacity: 0.7 },
  });
}
