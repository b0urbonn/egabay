import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { demoAlerts, demoRoutes } from '../data/demo';
import type { AppMode } from '../lib/appMode';
import type { Session } from '../lib/session';
import { useThemeStyles } from '../lib/theme';
import type { ThemeColors } from '../theme';

const quickPlaces = ['Boac', 'Gasan', 'Santa Cruz', 'Mogpog'];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function HomeScreen({
  session,
  mode,
  onNavigate,
}: {
  session: Session;
  mode: AppMode;
  onNavigate: (tab: 'Map' | 'Profile') => void;
}) {
  const styles = useThemeStyles(createStyles);
  const name = session.kind === 'account' ? session.name.split(' ')[0] : 'commuter';
  const today = new Intl.DateTimeFormat('en-PH', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date());

  return (
    <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
      <View>
        <Text style={styles.dateText}>{today}</Text>
        <Text style={styles.largeTitle}>
          {greeting()}, {name}
        </Text>
      </View>

      <View style={styles.section}>
        <Pressable
          accessibilityRole="search"
          accessibilityLabel="Search destinations"
          onPress={() => onNavigate('Map')}
          style={({ pressed }) => [styles.searchField, pressed && styles.searchFieldPressed]}
        >
          <Text style={styles.searchGlyph}>⌕</Text>
          <Text style={styles.searchPlaceholder}>Where to?</Text>
        </Pressable>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.placesRow}
          style={styles.placesScroll}
        >
          {quickPlaces.map((place) => (
            <Pressable
              key={place}
              accessibilityRole="button"
              accessibilityLabel={place}
              onPress={() => onNavigate('Map')}
              style={({ pressed }) => [styles.placePill, pressed && styles.pressed]}
            >
              <Text style={styles.placePillText}>{place}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {mode === 'offline' && (
        <View style={[styles.offlineCard, styles.section]}>
          <View style={styles.offlineDot} />
          <View style={styles.offlineCopy}>
            <Text style={styles.offlineTitle}>You&apos;re offline</Text>
            <Text style={styles.offlineDetail}>Showing saved routes and fares.</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Manage offline data"
            onPress={() => onNavigate('Profile')}
          >
            <Text style={styles.offlineAction}>Manage</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Routes</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="See all routes"
            onPress={() => onNavigate('Map')}
          >
            <Text style={styles.sectionAction}>See All</Text>
          </Pressable>
        </View>
        <View style={styles.group}>
          {demoRoutes.slice(0, 3).map((route, index) => (
            <View key={route.id}>
              {index > 0 && <View style={styles.separator} />}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={route.name}
                onPress={() => onNavigate('Map')}
                style={({ pressed }) => [styles.routeRow, pressed && styles.rowPressed]}
              >
                <View style={styles.routeCopy}>
                  <Text style={styles.routeName}>{route.name}</Text>
                  <Text style={styles.routeMeta}>
                    {route.duration} · {route.fare}
                  </Text>
                </View>
                {route.status === 'Limited units' && (
                  <Text style={styles.routeStatus}>Limited units</Text>
                )}
                <Text style={styles.chevron}>›</Text>
              </Pressable>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Service Updates</Text>
        </View>
        <View style={styles.group}>
          {demoAlerts.slice(0, 2).map((alert, index) => (
            <View key={alert.id}>
              {index > 0 && <View style={styles.alertSeparator} />}
              <View style={styles.alertRow}>
                <View
                  style={[
                    styles.alertDot,
                    alert.severity === 'notice' ? styles.alertDotNotice : styles.alertDotInfo,
                  ]}
                />
                <View style={styles.alertCopy}>
                  <Text style={styles.alertTitle}>{alert.title}</Text>
                  <Text style={styles.alertDetail}>{alert.detail}</Text>
                  <Text style={styles.alertMeta}>
                    {alert.locality} · {alert.time}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </View>

      <Text style={styles.footer}>Sample data — live information coming soon.</Text>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    pageContent: {
      paddingHorizontal: 20,
      paddingTop: 12,
      paddingBottom: 40,
    },
    dateText: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '400',
      color: colors.muted,
    },
    largeTitle: {
      fontSize: 34,
      lineHeight: 41,
      fontWeight: '700',
      letterSpacing: 0.37,
      color: colors.ink,
    },
    section: {
      marginTop: 28,
    },
    searchField: {
      height: 44,
      borderRadius: 12,
      backgroundColor: colors.fill,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
    },
    searchFieldPressed: {
      backgroundColor: colors.line,
    },
    searchGlyph: {
      fontSize: 17,
      color: colors.muted,
      marginRight: 6,
    },
    searchPlaceholder: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '400',
      color: colors.muted,
    },
    placesScroll: {
      marginTop: 12,
    },
    placesRow: {
      gap: 8,
    },
    placePill: {
      height: 32,
      paddingHorizontal: 14,
      borderRadius: 16,
      backgroundColor: colors.fill,
      justifyContent: 'center',
    },
    placePillText: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '500',
      color: colors.ink,
    },
    pressed: {
      opacity: 0.7,
    },
    offlineCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.card,
      borderRadius: 12,
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    offlineDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.orange,
      marginRight: 10,
    },
    offlineCopy: {
      flex: 1,
    },
    offlineTitle: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '400',
      color: colors.ink,
    },
    offlineDetail: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '400',
      color: colors.muted,
    },
    offlineAction: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '400',
      color: colors.green,
      marginLeft: 12,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    },
    sectionTitle: {
      fontSize: 20,
      lineHeight: 25,
      fontWeight: '600',
      color: colors.ink,
    },
    sectionAction: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '400',
      color: colors.green,
    },
    group: {
      backgroundColor: colors.card,
      borderRadius: 12,
      overflow: 'hidden',
    },
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.line,
      marginLeft: 16,
    },
    routeRow: {
      minHeight: 60,
      paddingVertical: 11,
      paddingHorizontal: 16,
      flexDirection: 'row',
      alignItems: 'center',
    },
    rowPressed: {
      backgroundColor: colors.line,
    },
    routeCopy: {
      flex: 1,
    },
    routeName: {
      fontSize: 17,
      lineHeight: 22,
      fontWeight: '600',
      color: colors.ink,
    },
    routeMeta: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '400',
      color: colors.muted,
    },
    routeStatus: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400',
      color: colors.orange,
      marginRight: 4,
    },
    chevron: {
      fontSize: 20,
      color: colors.muted,
      marginLeft: 4,
    },
    alertSeparator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.line,
      marginLeft: 36,
    },
    alertRow: {
      flexDirection: 'row',
      paddingVertical: 12,
      paddingHorizontal: 16,
    },
    alertDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      marginTop: 7,
      marginRight: 10,
    },
    alertDotNotice: {
      backgroundColor: colors.orange,
    },
    alertDotInfo: {
      backgroundColor: colors.green,
    },
    alertCopy: {
      flex: 1,
    },
    alertTitle: {
      fontSize: 15,
      lineHeight: 20,
      fontWeight: '600',
      color: colors.ink,
    },
    alertDetail: {
      fontSize: 13,
      lineHeight: 18,
      fontWeight: '400',
      color: colors.muted,
    },
    alertMeta: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400',
      color: colors.muted,
      marginTop: 4,
    },
    footer: {
      fontSize: 12,
      lineHeight: 16,
      fontWeight: '400',
      color: colors.muted,
      textAlign: 'center',
      marginTop: 24,
    },
  });
}
