import { useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { demoAlerts, demoRoutes, type CommuteRoute } from './src/data/demo';
import { isSupabaseConfigured } from './src/lib/supabase';
import { colors, spacing } from './src/theme';

type Tab = 'Home' | 'Plan' | 'Updates' | 'Profile';
const tabs: { label: Tab; glyph: string }[] = [
  { label: 'Home', glyph: '⌂' },
  { label: 'Plan', glyph: '↗' },
  { label: 'Updates', glyph: '◉' },
  { label: 'Profile', glyph: '○' },
];

function Eyebrow({ children }: { children: string }) {
  return <Text style={styles.eyebrow}>{children.toUpperCase()}</Text>;
}

function RouteCard({ route, onPress }: { route: CommuteRoute; onPress: () => void }) {
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

function MapPreview() {
  return (
    <View style={styles.mapPreview}>
      <View style={styles.mapIsland} />
      <View style={styles.mapRoadOne} />
      <View style={styles.mapRoadTwo} />
      <View style={styles.mapRoute} />
      <View style={[styles.mapPoint, styles.mapPointTop]} />
      <View style={[styles.mapPoint, styles.mapPointBottom]} />
      <View style={styles.mapLabelTop}><Text style={styles.mapLabelText}>BOAC</Text></View>
      <View style={styles.mapLabelBottom}><Text style={styles.mapLabelText}>GASAN</Text></View>
      <View style={styles.mapSample}><Text style={styles.mapSampleText}>SAMPLE MAP</Text></View>
    </View>
  );
}

function HomeScreen({ onNavigate }: { onNavigate: (tab: Tab) => void }) {
  return (
    <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
      <View style={styles.welcomeRow}>
        <View>
          <Eyebrow>Marinduque commute guide</Eyebrow>
          <Text style={styles.pageTitle}>Your island,{"\n"}a little closer.</Text>
        </View>
        <View style={styles.avatar}><Text style={styles.avatarText}>E</Text></View>
      </View>
      <View style={styles.heroCard}>
        <View style={styles.heroPill}><View style={styles.heroPillDot} /><Text style={styles.heroPillText}>MADE FOR THE ISLAND</Text></View>
        <Text style={styles.heroTitle}>Getting there{"\n"}starts here.</Text>
        <Text style={styles.heroBody}>Find routes, check local service updates, and know what to expect before you ride.</Text>
        <Pressable style={styles.heroButton} onPress={() => onNavigate('Plan')}>
          <Text style={styles.heroButtonText}>Plan a trip</Text><Text style={styles.heroButtonArrow}>→</Text>
        </Pressable>
        <View style={styles.heroDecorCircle} /><View style={styles.heroDecorLine} />
      </View>

      <View style={styles.searchBlock}>
        <View style={styles.sectionHeadingRow}>
          <Text style={styles.sectionTitle}>Where to?</Text>
          <Text style={styles.sectionHint}>Start with a place</Text>
        </View>
        <Pressable style={styles.destinationField} onPress={() => onNavigate('Plan')}>
          <View style={styles.destinationPin}><Text style={styles.destinationPinText}>⌖</Text></View>
          <Text style={styles.destinationPlaceholder}>Enter a destination</Text>
          <Text style={styles.destinationArrow}>→</Text>
        </Pressable>
        <View style={styles.quickPlaces}>
          {['Boac', 'Gasan', 'Santa Cruz'].map((place) => (
            <Pressable key={place} style={styles.placeChip} onPress={() => onNavigate('Plan')}>
              <Text style={styles.placeChipText}>{place}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={styles.sectionHeadingRow}>
        <View><Eyebrow>Explore the island</Eyebrow><Text style={styles.sectionTitle}>Popular trip</Text></View>
        <Pressable onPress={() => onNavigate('Plan')}><Text style={styles.textLink}>See routes  →</Text></Pressable>
      </View>
      <RouteCard route={demoRoutes[0]} onPress={() => onNavigate('Plan')} />

      <View style={styles.sectionHeadingRow}>
        <View><Eyebrow>Know before you go</Eyebrow><Text style={styles.sectionTitle}>Around Marinduque</Text></View>
        <Pressable onPress={() => onNavigate('Updates')}><Text style={styles.textLink}>All updates  →</Text></Pressable>
      </View>
      <View style={styles.homeAlert}>
        <View style={styles.alertIcon}><Text style={styles.alertIconText}>!</Text></View>
        <View style={styles.homeAlertCopy}>
          <Text style={styles.homeAlertTitle}>{demoAlerts[0].title}</Text>
          <Text style={styles.homeAlertDetail}>{demoAlerts[0].locality} · {demoAlerts[0].time}</Text>
        </View>
        <Text style={styles.homeAlertArrow}>›</Text>
      </View>
      <Text style={styles.demoNote}>Demo content only · route, fare, and vehicle details need operator confirmation.</Text>
    </ScrollView>
  );
}

function PlanScreen() {
  const [origin, setOrigin] = useState('Boac Town Plaza');
  const [destination, setDestination] = useState('Gasan Town Center');
  const [hasSearched, setHasSearched] = useState(false);
  const matchingRoute = useMemo(() => demoRoutes.find((route) =>
    (route.from + ' ' + route.to + ' ' + route.name).toLowerCase().includes(destination.trim().toLowerCase()) ||
    destination.toLowerCase().includes(route.to.toLowerCase().replace(' terminal', '').replace(' town center', '')),
  ) ?? demoRoutes[0], [destination]);

  return (
    <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
      <Eyebrow>Route finder</Eyebrow>
      <Text style={styles.pageTitle}>Plan your{"\n"}next ride.</Text>
      <Text style={styles.pageIntro}>See a simple route overview for places across Marinduque.</Text>
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
        </View>
        <Pressable style={styles.searchButton} onPress={() => setHasSearched(true)}>
          <Text style={styles.searchButtonText}>Find a route</Text><Text style={styles.searchButtonArrow}>→</Text>
        </Pressable>
      </View>
      <View style={styles.sectionHeadingRow}>
        <View><Eyebrow>Suggested route</Eyebrow><Text style={styles.sectionTitle}>{hasSearched ? 'Best available match' : 'A popular trip'}</Text></View>
        <View style={styles.sampleBadge}><Text style={styles.sampleBadgeText}>SAMPLE</Text></View>
      </View>
      <MapPreview />
      <RouteCard route={matchingRoute} onPress={() => setHasSearched(true)} />
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

function UpdatesScreen() {
  return (
    <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
      <Eyebrow>Service board</Eyebrow>
      <Text style={styles.pageTitle}>Island{"\n"}updates.</Text>
      <Text style={styles.pageIntro}>Local notices can help you adjust your trip before you leave.</Text>
      <MapPreview />
      <View style={styles.updatesSummary}>
        <View style={styles.updatesPulse} />
        <Text style={styles.updatesSummaryText}>2 sample updates for today</Text>
        <Text style={styles.updatesSummaryDate}>DEMO</Text>
      </View>
      {demoAlerts.map((alert) => (
        <View style={styles.updateCard} key={alert.id}>
          <View style={[styles.updateIcon, alert.severity === 'notice' && styles.updateIconNotice]}>
            <Text style={[styles.updateIconText, alert.severity === 'notice' && styles.updateIconTextNotice]}>{alert.severity === 'notice' ? '!' : 'i'}</Text>
          </View>
          <View style={styles.updateCopy}>
            <Text style={styles.updateLocality}>{alert.locality} · {alert.time}</Text>
            <Text style={styles.updateTitle}>{alert.title}</Text>
            <Text style={styles.updateDetail}>{alert.detail}</Text>
          </View>
        </View>
      ))}
      <Text style={styles.demoNote}>Sample notices only · updates will come from verified operator or local authority accounts.</Text>
    </ScrollView>
  );
}

function ProfileScreen() {
  return (
    <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
      <Eyebrow>Your eGABAY</Eyebrow>
      <Text style={styles.pageTitle}>A better way{"\n"}to get around.</Text>
      <View style={styles.profileCard}>
        <View style={styles.profileAvatar}><Text style={styles.profileAvatarText}>E</Text></View>
        <Text style={styles.profileTitle}>Welcome aboard</Text>
        <Text style={styles.profileBody}>Create an account later to save favorite places and manage your commuter preferences.</Text>
        <View style={styles.profileDivider} />
        <View style={styles.profileRow}><Text style={styles.profileRowLabel}>Account</Text><Text style={styles.profileRowValue}>{isSupabaseConfigured ? 'Supabase ready' : 'Backend not connected'}</Text></View>
        <View style={styles.profileRow}><Text style={styles.profileRowLabel}>Service area</Text><Text style={styles.profileRowValue}>Marinduque, PH</Text></View>
      </View>
      <View style={styles.tipCard}>
        <Text style={styles.tipGlyph}>⌁</Text>
        <View style={styles.tipCopy}>
          <Text style={styles.tipTitle}>Built with local knowledge</Text>
          <Text style={styles.tipBody}>Routes and service information should be reviewed with transport groups and local communities before launch.</Text>
        </View>
      </View>
      {!isSupabaseConfigured && (
        <View style={styles.connectCard}>
          <Text style={styles.connectTitle}>Connect your Supabase project</Text>
          <Text style={styles.connectBody}>Copy .env.example to .env.local and add your project URL and publishable key to enable backend features.</Text>
        </View>
      )}
    </ScrollView>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('Home');

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.canvas} />
      <View style={styles.appHeader}>
        <View style={styles.brandMark}><Text style={styles.brandMarkText}>e</Text></View>
        <Text style={styles.brandName}>eGABAY</Text>
        <View style={styles.headerSpacer} />
        <View style={styles.areaBadge}><Text style={styles.areaBadgeText}>MARINDUQUE</Text></View>
      </View>
      <View style={styles.screen}>
        {activeTab === 'Home' && <HomeScreen onNavigate={setActiveTab} />}
        {activeTab === 'Plan' && <PlanScreen />}
        {activeTab === 'Updates' && <UpdatesScreen />}
        {activeTab === 'Profile' && <ProfileScreen />}
      </View>
      <View style={styles.tabBar}>
        {tabs.map((tab) => {
          const selected = activeTab === tab.label;
          return (
            <Pressable style={styles.tabItem} key={tab.label} onPress={() => setActiveTab(tab.label)}>
              <View style={[styles.tabGlyphWrap, selected && styles.tabGlyphWrapSelected]}>
                <Text style={[styles.tabGlyph, selected && styles.tabGlyphSelected]}>{tab.glyph}</Text>
              </View>
              <Text style={[styles.tabLabel, selected && styles.tabLabelSelected]}>{tab.label}</Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas },
  screen: { flex: 1 },
  appHeader: { minHeight: 62, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.lg, gap: 9, borderBottomWidth: 1, borderBottomColor: colors.line },
  brandMark: { width: 31, height: 31, borderRadius: 10, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  brandMarkText: { color: colors.lime, fontSize: 22, fontWeight: '900', lineHeight: 25 },
  brandName: { color: colors.ink, fontSize: 16, fontWeight: '900', letterSpacing: 1.1 },
  headerSpacer: { flex: 1 },
  areaBadge: { backgroundColor: colors.greenLight, borderRadius: 20, paddingVertical: 7, paddingHorizontal: 10 },
  areaBadgeText: { color: colors.greenDark, fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  pageContent: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: 34, gap: 18 },
  welcomeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 },
  eyebrow: { color: colors.green, fontSize: 10, fontWeight: '800', letterSpacing: 1.35, marginBottom: 7 },
  pageTitle: { color: colors.ink, fontSize: 35, lineHeight: 39, letterSpacing: -1.4, fontWeight: '800' },
  pageIntro: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: -9, marginBottom: 2, maxWidth: 330 },
  avatar: { width: 43, height: 43, borderRadius: 16, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: colors.greenDark, fontSize: 20, fontWeight: '900' },
  heroCard: { backgroundColor: colors.green, borderRadius: 23, paddingHorizontal: 22, paddingTop: 20, paddingBottom: 20, overflow: 'hidden', minHeight: 224 },
  heroPill: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,0.14)', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 18, gap: 7 },
  heroPillDot: { width: 6, height: 6, backgroundColor: colors.lime, borderRadius: 3 },
  heroPillText: { color: '#F4FAF2', fontSize: 9, fontWeight: '800', letterSpacing: 1.1 },
  heroTitle: { color: '#FFFFFF', fontSize: 27, lineHeight: 30, fontWeight: '800', letterSpacing: -0.7, marginTop: 14 },
  heroBody: { color: '#DDECE3', fontSize: 12, lineHeight: 18, marginTop: 8, maxWidth: 250 },
  heroButton: { marginTop: 15, height: 40, backgroundColor: colors.lime, paddingHorizontal: 14, borderRadius: 13, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 15 },
  heroButtonText: { color: colors.greenDark, fontSize: 12, fontWeight: '800' },
  heroButtonArrow: { color: colors.greenDark, fontSize: 18, lineHeight: 20 },
  heroDecorCircle: { position: 'absolute', width: 150, height: 150, borderRadius: 75, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', right: -61, top: 55 },
  heroDecorLine: { position: 'absolute', width: 145, height: 1, backgroundColor: 'rgba(255,255,255,0.18)', right: -31, top: 116, transform: [{ rotate: '-38deg' }] },
  searchBlock: { gap: 11 },
  sectionHeadingRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  sectionTitle: { color: colors.ink, fontSize: 19, fontWeight: '800', letterSpacing: -0.35 },
  sectionHint: { color: colors.muted, fontSize: 11, marginBottom: 2 },
  destinationField: { minHeight: 55, backgroundColor: colors.card, borderRadius: 16, borderColor: colors.line, borderWidth: 1, paddingHorizontal: 13, flexDirection: 'row', alignItems: 'center', gap: 10 },
  destinationPin: { width: 29, height: 29, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.greenLight },
  destinationPinText: { color: colors.green, fontSize: 17, fontWeight: '700' },
  destinationPlaceholder: { flex: 1, color: colors.muted, fontSize: 13 },
  destinationArrow: { color: colors.green, fontSize: 19, fontWeight: '700' },
  quickPlaces: { flexDirection: 'row', gap: 8 },
  placeChip: { borderRadius: 16, borderWidth: 1, borderColor: colors.line, backgroundColor: '#FBFCFA', paddingHorizontal: 12, paddingVertical: 7 },
  placeChipText: { color: colors.ink, fontSize: 10, fontWeight: '700' },
  textLink: { color: colors.green, fontSize: 11, fontWeight: '800', marginBottom: 2 },
  routeCard: { backgroundColor: colors.card, borderRadius: 18, borderWidth: 1, borderColor: colors.line, padding: 15 },
  pressed: { opacity: 0.8 },
  routeCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  routeIcon: { width: 34, height: 34, backgroundColor: colors.greenLight, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  routeIconText: { color: colors.green, fontSize: 18, fontWeight: '700' },
  routeStatus: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F0F7EF', paddingHorizontal: 9, paddingVertical: 6, borderRadius: 14, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: '#50A669' },
  routeStatusText: { color: colors.greenDark, fontSize: 9, fontWeight: '700' },
  routeTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  routeVia: { color: colors.muted, fontSize: 11, marginTop: 4 },
  routeDivider: { height: 1, backgroundColor: colors.line, marginVertical: 12 },
  routeMetaRow: { flexDirection: 'row', justifyContent: 'space-between' },
  routeMeta: { color: colors.ink, fontSize: 11, fontWeight: '700' },
  routeUnits: { color: colors.muted, fontSize: 10, marginTop: 9 },
  homeAlert: { backgroundColor: colors.card, borderRadius: 16, borderWidth: 1, borderColor: colors.line, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  alertIcon: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.orangeLight },
  alertIconText: { color: colors.orange, fontWeight: '900', fontSize: 14 },
  homeAlertCopy: { flex: 1 },
  homeAlertTitle: { color: colors.ink, fontSize: 11, lineHeight: 16, fontWeight: '800' },
  homeAlertDetail: { color: colors.muted, fontSize: 9, marginTop: 3 },
  homeAlertArrow: { color: colors.muted, fontSize: 22 },
  demoNote: { color: colors.muted, fontSize: 9, lineHeight: 14, textAlign: 'center', paddingHorizontal: 8 },
  plannerCard: { backgroundColor: colors.card, padding: 14, borderRadius: 19, borderColor: colors.line, borderWidth: 1, marginTop: 2 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 },
  inputCopy: { flex: 1 },
  inputLabel: { color: colors.muted, fontSize: 8, fontWeight: '800', letterSpacing: 1.1 },
  input: { color: colors.ink, fontSize: 13, fontWeight: '700', padding: 0, marginTop: 4 },
  originMark: { width: 24, height: 24, borderRadius: 12, borderWidth: 1.5, borderColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  originMarkDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green },
  destinationMark: { width: 24, height: 24, borderRadius: 8, backgroundColor: colors.orangeLight, alignItems: 'center', justifyContent: 'center' },
  destinationMarkDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.orange },
  inputConnector: { marginLeft: 11, height: 15, borderLeftWidth: 1.5, borderColor: '#CED9CF', borderStyle: 'dashed' },
  searchButton: { height: 48, borderRadius: 14, marginTop: 12, backgroundColor: colors.green, paddingHorizontal: 15, alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row' },
  searchButtonText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  searchButtonArrow: { color: colors.lime, fontSize: 21, fontWeight: '700' },
  sampleBadge: { backgroundColor: colors.orangeLight, borderRadius: 12, paddingHorizontal: 8, paddingVertical: 5, marginBottom: 2 },
  sampleBadgeText: { color: colors.orange, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  mapPreview: { height: 174, backgroundColor: '#DFEBE7', borderRadius: 19, overflow: 'hidden', position: 'relative' },
  mapIsland: { position: 'absolute', width: 120, height: 230, backgroundColor: '#B8D7C1', borderRadius: 70, left: '38%', top: -23, transform: [{ rotate: '32deg' }] },
  mapRoadOne: { position: 'absolute', height: 1, backgroundColor: 'rgba(255,255,255,0.72)', width: 250, top: 62, left: 10, transform: [{ rotate: '21deg' }] },
  mapRoadTwo: { position: 'absolute', height: 1, backgroundColor: 'rgba(255,255,255,0.72)', width: 230, top: 120, left: 65, transform: [{ rotate: '-32deg' }] },
  mapRoute: { position: 'absolute', height: 4, width: 132, borderRadius: 4, backgroundColor: colors.green, left: '32%', top: '50%', transform: [{ rotate: '63deg' }] },
  mapPoint: { position: 'absolute', width: 14, height: 14, borderRadius: 8, backgroundColor: colors.lime, borderWidth: 3, borderColor: colors.green },
  mapPointTop: { left: '46%', top: 27 },
  mapPointBottom: { left: '62%', bottom: 26 },
  mapLabelTop: { position: 'absolute', left: '49%', top: 20, backgroundColor: '#FFFFFF', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 7 },
  mapLabelBottom: { position: 'absolute', left: '66%', bottom: 21, backgroundColor: '#FFFFFF', paddingHorizontal: 7, paddingVertical: 4, borderRadius: 7 },
  mapLabelText: { color: colors.greenDark, fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
  mapSample: { position: 'absolute', left: 11, bottom: 10, backgroundColor: 'rgba(255,255,255,0.85)', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 7 },
  mapSampleText: { color: colors.muted, fontSize: 7, fontWeight: '900', letterSpacing: 0.8 },
  tipCard: { flexDirection: 'row', gap: 11, padding: 14, backgroundColor: '#F0F6EC', borderRadius: 16 },
  tipGlyph: { color: colors.green, fontSize: 19, fontWeight: '800' },
  tipCopy: { flex: 1 },
  tipTitle: { color: colors.greenDark, fontSize: 11, fontWeight: '800', marginBottom: 4 },
  tipBody: { color: '#5E7566', fontSize: 10, lineHeight: 15 },
  updatesSummary: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.greenLight, borderRadius: 12, padding: 11, gap: 8 },
  updatesPulse: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.green },
  updatesSummaryText: { flex: 1, color: colors.greenDark, fontSize: 10, fontWeight: '800' },
  updatesSummaryDate: { color: colors.green, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  updateCard: { flexDirection: 'row', gap: 12, backgroundColor: colors.card, borderRadius: 17, padding: 14, borderColor: colors.line, borderWidth: 1 },
  updateIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.greenLight, alignItems: 'center', justifyContent: 'center' },
  updateIconNotice: { backgroundColor: colors.orangeLight },
  updateIconText: { color: colors.green, fontSize: 12, fontWeight: '900' },
  updateIconTextNotice: { color: colors.orange },
  updateCopy: { flex: 1 },
  updateLocality: { color: colors.muted, fontSize: 9, marginBottom: 5 },
  updateTitle: { color: colors.ink, fontSize: 13, lineHeight: 18, fontWeight: '800' },
  updateDetail: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 5 },
  profileCard: { backgroundColor: colors.card, borderRadius: 21, borderWidth: 1, borderColor: colors.line, padding: 20, alignItems: 'center', marginTop: 2 },
  profileAvatar: { width: 60, height: 60, borderRadius: 21, backgroundColor: colors.green, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  profileAvatarText: { color: colors.lime, fontSize: 30, fontWeight: '900' },
  profileTitle: { color: colors.ink, fontSize: 17, fontWeight: '800' },
  profileBody: { color: colors.muted, textAlign: 'center', fontSize: 11, lineHeight: 17, marginTop: 7, maxWidth: 260 },
  profileDivider: { height: 1, backgroundColor: colors.line, width: '100%', marginVertical: 16 },
  profileRow: { width: '100%', flexDirection: 'row', justifyContent: 'space-between', marginVertical: 6 },
  profileRowLabel: { color: colors.muted, fontSize: 10 },
  profileRowValue: { color: colors.ink, fontSize: 10, fontWeight: '700' },
  connectCard: { borderWidth: 1, borderColor: '#F0D8C2', backgroundColor: '#FFF8F1', padding: 14, borderRadius: 16, gap: 5 },
  connectTitle: { color: '#8C4B22', fontSize: 11, fontWeight: '800' },
  connectBody: { color: '#916A50', fontSize: 10, lineHeight: 15 },
  tabBar: { minHeight: 67, paddingHorizontal: 14, paddingTop: 7, paddingBottom: 5, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.card, flexDirection: 'row', justifyContent: 'space-around' },
  tabItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  tabGlyphWrap: { width: 34, height: 29, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  tabGlyphWrapSelected: { backgroundColor: colors.greenLight },
  tabGlyph: { color: colors.muted, fontSize: 18, lineHeight: 21, fontWeight: '600' },
  tabGlyphSelected: { color: colors.green, fontWeight: '900' },
  tabLabel: { color: colors.muted, fontSize: 8, fontWeight: '700' },
  tabLabelSelected: { color: colors.greenDark },
});
