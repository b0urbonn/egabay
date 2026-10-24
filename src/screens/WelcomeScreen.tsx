import { SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { Badge, BrandMark, Button, Divider } from '../components/ui';
import { useThemeStyles } from '../lib/theme';
import { radius, spacing, type ThemeColors } from '../theme';

export function WelcomeScreen({
  onLogin,
  onSignUp,
  onOffline,
}: {
  onLogin: () => void;
  onSignUp: () => void;
  onOffline: () => void;
}) {
  const styles = useThemeStyles(createStyles);
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.heroDecorCircle} />
          <View style={styles.heroDecorLine} />
          <View style={styles.brandRow}>
            <BrandMark size={46} />
            <View>
              <Text style={styles.brandName}>eGABAY</Text>
              <Text style={styles.brandSub}>MARINDUQUE</Text>
            </View>
          </View>
          <Text style={styles.tagline}>Your island,{'\n'}a little closer.</Text>
          <Text style={styles.heroBody}>
            AI-assisted routes, fares, and service updates for getting around Marinduque — online or offline.
          </Text>
          <View style={styles.heroBadgeRow}>
            <Badge label="ROUTES" />
            <Badge label="FARES" />
            <Badge label="LIVE UPDATES" />
          </View>
        </View>
        <View style={styles.actions}>
          <Button label="Log in" onPress={onLogin} />
          <Button label="Create an account" variant="secondary" onPress={onSignUp} />
          <Divider label="or" />
          <View style={styles.offlineBlock}>
            <Button label="Continue offline" variant="ghost" glyph="▤" onPress={onOffline} />
            <Text style={styles.offlineCaption}>No account needed · uses saved routes, stops and fares</Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.canvas },
    container: { flex: 1, padding: spacing.lg, gap: spacing.lg, justifyContent: 'center' },
    hero: { backgroundColor: colors.green, borderRadius: radius.xl, padding: spacing.lg, overflow: 'hidden', minHeight: 300, justifyContent: 'center' },
    heroDecorCircle: { position: 'absolute', width: 190, height: 190, borderRadius: 95, borderWidth: 1, borderColor: 'rgba(255,255,255,0.13)', right: -70, top: -50 },
    heroDecorLine: { position: 'absolute', width: 160, height: 1, backgroundColor: 'rgba(255,255,255,0.18)', right: -30, bottom: 80, transform: [{ rotate: '-38deg' }] },
    brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    brandName: { color: '#FFFFFF', fontSize: 20, fontWeight: '900', letterSpacing: 1.2 },
    brandSub: { color: 'rgba(255,255,255,0.75)', fontSize: 9, fontWeight: '800', letterSpacing: 2, marginTop: 2 },
    tagline: { color: '#FFFFFF', fontSize: 30, lineHeight: 34, fontWeight: '800', letterSpacing: -0.8, marginTop: 22 },
    heroBody: { color: '#DDECE3', fontSize: 13, lineHeight: 19, marginTop: 10, maxWidth: 290 },
    heroBadgeRow: { flexDirection: 'row', gap: 8, marginTop: 18 },
    actions: { gap: 12 },
    offlineBlock: { gap: 8 },
    offlineCaption: { color: colors.muted, fontSize: 10, textAlign: 'center' },
  });
}
