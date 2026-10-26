import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  demoOngoingTrips,
  demoTripHistory,
  type ScheduledTrip,
  type TripProgressStatus,
  type TripStatus,
} from '../data/demo';
import { useThemeStyles } from '../lib/theme';
import { useWideLayout } from '../lib/useWideLayout';
import { radius, spacing, type ThemeColors } from '../theme';

type TripsView = 'Ongoing' | 'History';

function StatusBadge({ status }: { status: TripStatus }) {
  const styles = useThemeStyles(createStyles);
  const tone = status === 'Pending' ? styles.pendingBadge : status === 'Completed' ? styles.completedBadge : styles.approvedBadge;
  const textTone = status === 'Pending' ? styles.pendingText : status === 'Completed' ? styles.completedText : styles.approvedText;

  return (
    <View style={[styles.statusBadge, tone]}>
      <Text style={[styles.statusText, textTone]}>{status}</Text>
    </View>
  );
}

function ProgressBadge({ status }: { status: TripProgressStatus }) {
  const styles = useThemeStyles(createStyles);
  const badgeStyle = status === 'On the way'
    ? styles.onWayBadge
    : status === 'Boarding'
      ? styles.boardingBadge
      : status === 'Available'
        ? styles.availableBadge
        : styles.arrivedBadge;
  const textStyle = status === 'On the way'
    ? styles.onWayText
    : status === 'Boarding'
      ? styles.boardingText
      : status === 'Available'
        ? styles.availableText
        : styles.arrivedText;

  return (
    <View style={[styles.statusBadge, badgeStyle]}>
      <Text style={[styles.statusText, textStyle]}>{status}</Text>
    </View>
  );
}

function OngoingTripCard({ trip }: { trip: ScheduledTrip }) {
  const styles = useThemeStyles(createStyles);
  const isWide = useWideLayout();

  return (
    <View style={[styles.ongoingCard, isWide && styles.cardWide]}>
      <View style={styles.cardTopRow}>
        <Text accessibilityRole="header" style={styles.routeTitle}>{trip.route}</Text>
        {trip.progressStatus && <ProgressBadge status={trip.progressStatus} />}
      </View>
      <Text style={styles.vehicleLine}>{trip.vehicleType} · {trip.vehicleNumber}</Text>
      <View style={styles.cardFooter}>
        <View style={styles.footerItem}>
          <Text style={styles.footerLabel}>DEPARTURE</Text>
          <Text style={styles.footerTime}>{trip.date} · {trip.time}</Text>
        </View>
        <View style={[styles.footerItem, styles.footerItemTrailing]}>
          <Text style={styles.footerLabel}>EST. ARRIVAL</Text>
          <Text style={styles.footerTime}>{trip.date} · {trip.estimatedArrival}</Text>
        </View>
      </View>
    </View>
  );
}

function HistoryTripCard({ trip }: { trip: ScheduledTrip }) {
  const styles = useThemeStyles(createStyles);
  const isWide = useWideLayout();
  return (
    <View style={[styles.historyCard, isWide && styles.cardWide]}>
      <View style={styles.cardTopRow}>
        <Text style={styles.tripDate}>{trip.date} · {trip.time}</Text>
        <StatusBadge status={trip.status} />
      </View>
      <Text style={styles.historyRouteTitle}>{trip.route}</Text>
      <Text style={styles.historyRoute}>{trip.pickup} → {trip.destination}</Text>
      <View style={styles.historyFooter}>
        <Text style={styles.historyVehicle}>{trip.vehicleType} · {trip.vehicleNumber}</Text>
        <Text style={styles.historyDuration}>{trip.estimatedTravelTime}</Text>
      </View>
    </View>
  );
}

export function TripsScreen() {
  const styles = useThemeStyles(createStyles);
  const isWide = useWideLayout();
  const [selectedView, setSelectedView] = useState<TripsView>('Ongoing');
  const trips = selectedView === 'Ongoing' ? demoOngoingTrips : demoTripHistory;

  return (
    <ScrollView
      contentContainerStyle={styles.pageContent}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.pageHeader}>
        <Text accessibilityRole="header" style={styles.pageTitle}>Trips</Text>
      </View>

      <View style={styles.segmentedControl} accessibilityRole="tablist">
        {(['Ongoing', 'History'] as TripsView[]).map((view) => {
          const selected = selectedView === view;
          return (
            <Pressable
              key={view}
              accessibilityRole="button"
              accessibilityLabel={`${view} trips`}
              accessibilityState={{ selected }}
              onPress={() => setSelectedView(view)}
              style={({ pressed }) => [styles.segment, selected && styles.segmentSelected, pressed && styles.segmentPressed]}
            >
              <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>{view}</Text>
            </Pressable>
          );
        })}
      </View>

      {selectedView === 'History' && (
        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Past trips</Text>
          <Text style={styles.tripCount}>{trips.length} {trips.length === 1 ? 'trip' : 'trips'}</Text>
        </View>
      )}

      <View style={isWide && styles.cardGrid}>
        {selectedView === 'Ongoing'
          ? trips.map((trip) => <OngoingTripCard key={trip.id} trip={trip} />)
          : trips.map((trip) => <HistoryTripCard key={trip.id} trip={trip} />)}
      </View>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    pageContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 36 },
    pageHeader: { marginBottom: 16 },
    pageTitle: { color: colors.ink, fontSize: 32, lineHeight: 38, letterSpacing: -0.8, fontWeight: '700' },
    segmentedControl: { minHeight: 52, flexDirection: 'row', alignItems: 'center', padding: 4, borderRadius: radius.md, backgroundColor: colors.fill, marginBottom: 24 },
    segment: { minHeight: 44, flex: 1, borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
    segmentSelected: { backgroundColor: colors.card, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.line },
    segmentPressed: { opacity: 0.75 },
    segmentText: { color: colors.muted, fontSize: 15, fontWeight: '500' },
    segmentTextSelected: { color: colors.ink, fontWeight: '600' },
    listHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
    listTitle: { color: colors.ink, fontSize: 20, lineHeight: 25, fontWeight: '600', letterSpacing: -0.25 },
    tripCount: { color: colors.muted, fontSize: 13 },
    ongoingCard: { backgroundColor: colors.card, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.line, padding: 15, marginBottom: 12 },
    historyCard: { backgroundColor: colors.card, borderRadius: radius.md, borderWidth: 1, borderColor: colors.line, padding: 14, marginBottom: 10 },
    cardGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
    cardWide: { width: '49%' },
    cardTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 },
    tripDate: { color: colors.muted, fontSize: 13, lineHeight: 18, fontWeight: '500' },
    statusBadge: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6, marginTop: 1 },
    approvedBadge: { backgroundColor: colors.greenLight },
    pendingBadge: { backgroundColor: colors.orangeLight },
    completedBadge: { backgroundColor: colors.chipBg, borderWidth: 1, borderColor: colors.line },
    statusText: { fontSize: 12, lineHeight: 16, fontWeight: '600' },
    approvedText: { color: colors.greenDark },
    pendingText: { color: colors.orangeDark },
    completedText: { color: colors.muted },
    onWayBadge: { backgroundColor: colors.blueLight },
    onWayText: { color: colors.blue },
    boardingBadge: { backgroundColor: colors.orangeLight },
    boardingText: { color: colors.orangeDark },
    availableBadge: { backgroundColor: colors.greenLight },
    availableText: { color: colors.greenDark },
    arrivedBadge: { backgroundColor: colors.purpleLight },
    arrivedText: { color: colors.purple },
    routeTitle: { flex: 1, color: colors.ink, fontSize: 17, lineHeight: 22, fontWeight: '600', letterSpacing: -0.2, marginTop: 2 },
    vehicleLine: { color: colors.muted, fontSize: 14, lineHeight: 19, fontWeight: '500', marginTop: 7 },
    cardFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 11, paddingTop: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
    footerItem: { flex: 1 },
    footerItemTrailing: { alignItems: 'flex-end' },
    footerLabel: { color: colors.muted, fontSize: 10, lineHeight: 14, fontWeight: '700', letterSpacing: 0.55 },
    footerTime: { color: colors.ink, fontSize: 13, lineHeight: 18, fontWeight: '600', marginTop: 2 },
    historyRouteTitle: { color: colors.ink, fontSize: 16, lineHeight: 21, fontWeight: '600', marginTop: 8 },
    historyRoute: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: 2 },
    historyFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 11, paddingTop: 9, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
    historyVehicle: { color: colors.muted, fontSize: 12, lineHeight: 16 },
    historyDuration: { color: colors.ink, fontSize: 12, lineHeight: 16, fontWeight: '600' },
  });
}
