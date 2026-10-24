import { useState, type ReactNode } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { Button } from '../components/ui';
import { useThemeStyles } from '../lib/theme';
import { radius, spacing, type ThemeColors } from '../theme';

type Slide = {
  eyebrow: string;
  title: string;
  body: string;
  art: 'welcome' | 'plan' | 'monitor' | 'offline';
};

const slides: Slide[] = [
  {
    eyebrow: 'Welcome to eGABAY',
    title: 'Your AI-powered commuting companion',
    body: 'eGABAY helps you move around Marinduque with routes, stops, fares, and service updates built for the island.',
    art: 'welcome',
  },
  {
    eyebrow: 'Plan trips with confidence',
    title: 'Routes, stops, and fares in one place',
    body: 'Find trips across Boac, Gasan, Santa Cruz, Mogpog, Buenavista, and Torrijos — with fare ranges before you ride.',
    art: 'plan',
  },
  {
    eyebrow: 'Live monitoring & updates',
    title: 'Know what is happening on the road',
    body: 'See vehicle positions from participating units and local notices that can change your trip.',
    art: 'monitor',
  },
  {
    eyebrow: 'Works online or offline',
    title: 'Reliable even with weak signal',
    body: 'eGABAY is hybrid by design — saved routes, stops, and fares keep working across the island, and sync when you are back online.',
    art: 'offline',
  },
];

function SlideArt({ kind }: { kind: Slide['art'] }) {
  const styles = useThemeStyles(createStyles);
  let content: ReactNode = null;
  if (kind === 'welcome') {
    content = (
      <View style={styles.artStage}>
        <View style={styles.artSun} />
        <View style={styles.artIsland} />
        <View style={[styles.artBubble, { left: 26, top: 30 }]}><Text style={styles.artBubbleText}>⌖</Text></View>
        <View style={[styles.artBubble, { right: 30, bottom: 46 }]}><Text style={styles.artBubbleText}>◉</Text></View>
        <View style={styles.artBrandPill}><Text style={styles.artBrandPillText}>eGABAY</Text></View>
      </View>
    );
  } else if (kind === 'plan') {
    content = (
      <View style={styles.artStage}>
        <View style={styles.artRouteLine} />
        <View style={[styles.artDot, { left: 40, top: 46 }]} />
        <View style={[styles.artDot, { right: 44, bottom: 52 }]} />
        <View style={styles.artCardRow}><Text style={styles.artCardRowText}>Boac  →  Gasan</Text></View>
        <View style={[styles.artCardRow, styles.artCardRowAlt]}><Text style={styles.artCardRowText}>₱60–₱75 · 48 min</Text></View>
      </View>
    );
  } else if (kind === 'monitor') {
    content = (
      <View style={styles.artStage}>
        <View style={styles.artRingOuter}><View style={styles.artRingInner}><Text style={styles.artRingGlyph}>◉</Text></View></View>
        <View style={[styles.artBubble, { right: 36, top: 34 }]}><Text style={styles.artBubbleText}>!</Text></View>
        <View style={styles.artCardRow}><Text style={styles.artCardRowText}>2 units nearby · On time</Text></View>
      </View>
    );
  } else {
    content = (
      <View style={styles.artStage}>
        <View style={styles.artGlyphCircle}><Text style={styles.artGlyphCircleText}>▤</Text></View>
        <View style={styles.artCardRow}><Text style={styles.artCardRowText}>Saved routes · stops · fares</Text></View>
        <View style={[styles.artCardRow, styles.artCardRowAlt]}><Text style={styles.artCardRowText}>Syncs when back online</Text></View>
      </View>
    );
  }
  return <View style={styles.artFrame}>{content}</View>;
}

export function OnboardingScreen({ onDone }: { onDone: () => void }) {
  const styles = useThemeStyles(createStyles);
  const [index, setIndex] = useState(0);
  const slide = slides[index];
  const last = index === slides.length - 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topRow}>
        <View style={styles.dotsRow}>
          {slides.map((s, i) => (
            <View key={s.art} style={[styles.dot, i === index && styles.dotActive]} />
          ))}
        </View>
        {!last && (
          <Pressable onPress={onDone} hitSlop={10}>
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        )}
      </View>
      <View style={styles.body}>
        <SlideArt kind={slide.art} />
        <Text style={styles.eyebrow}>{slide.eyebrow.toUpperCase()}</Text>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.bodyText}>{slide.body}</Text>
      </View>
      <View style={styles.footer}>
        <Button
          label={last ? 'Get started' : 'Next'}
          glyph={last ? '→' : undefined}
          onPress={() => (last ? onDone() : setIndex((i) => i + 1))}
        />
      </View>
    </SafeAreaView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.canvas },
    topRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing.lg, paddingTop: spacing.md, minHeight: 44 },
    dotsRow: { flexDirection: 'row', gap: 6 },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.line },
    dotActive: { width: 22, backgroundColor: colors.green },
    skipText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
    body: { flex: 1, paddingHorizontal: spacing.lg, justifyContent: 'center', gap: 8 },
    eyebrow: { color: colors.green, fontSize: 10, fontWeight: '800', letterSpacing: 1.35 },
    title: { color: colors.ink, fontSize: 30, lineHeight: 34, letterSpacing: -1, fontWeight: '800' },
    bodyText: { color: colors.muted, fontSize: 14, lineHeight: 21, maxWidth: 340 },
    footer: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
    artFrame: { marginBottom: spacing.lg },
    artStage: { height: 220, borderRadius: radius.xl, backgroundColor: colors.green, overflow: 'hidden', position: 'relative', alignItems: 'center', justifyContent: 'center', gap: 10 },
    artSun: { position: 'absolute', width: 190, height: 190, borderRadius: 95, borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)', right: -70, top: -60 },
    artIsland: { position: 'absolute', width: 110, height: 200, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.12)', left: -30, bottom: -70, transform: [{ rotate: '24deg' }] },
    artBubble: { position: 'absolute', width: 44, height: 44, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
    artBubbleText: { color: '#FFFFFF', fontSize: 19, fontWeight: '800' },
    artBrandPill: { backgroundColor: colors.lime, borderRadius: radius.pill, paddingHorizontal: 20, paddingVertical: 10 },
    artBrandPillText: { color: colors.onLime, fontSize: 18, fontWeight: '900', letterSpacing: 1.4 },
    artRouteLine: { position: 'absolute', width: 4, height: 150, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.35)', transform: [{ rotate: '38deg' }] },
    artDot: { position: 'absolute', width: 16, height: 16, borderRadius: 8, backgroundColor: colors.lime, borderWidth: 3, borderColor: '#FFFFFF' },
    artCardRow: { backgroundColor: 'rgba(255,255,255,0.14)', borderRadius: radius.md, paddingHorizontal: 16, paddingVertical: 9 },
    artCardRowAlt: { backgroundColor: 'rgba(198,240,106,0.22)' },
    artCardRowText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
    artRingOuter: { width: 96, height: 96, borderRadius: 48, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.35)', alignItems: 'center', justifyContent: 'center' },
    artRingInner: { width: 62, height: 62, borderRadius: 31, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
    artRingGlyph: { color: colors.lime, fontSize: 24, fontWeight: '800' },
    artGlyphCircle: { width: 84, height: 84, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.16)', alignItems: 'center', justifyContent: 'center' },
    artGlyphCircleText: { color: colors.lime, fontSize: 36, fontWeight: '800' },
  });
}
