import { StyleSheet, Text, View } from 'react-native';

import { useThemeStyles } from '../lib/theme';
import { radius, type ThemeColors } from '../theme';

export function MapPreview({ topLabel = 'BOAC', bottomLabel = 'GASAN' }: { topLabel?: string; bottomLabel?: string }) {
  const styles = useThemeStyles(createStyles);
  return (
    <View style={styles.mapPreview}>
      <View style={styles.mapIsland} />
      <View style={styles.mapRoadOne} />
      <View style={styles.mapRoadTwo} />
      <View style={styles.mapRoute} />
      <View style={[styles.mapPoint, styles.mapPointTop]} />
      <View style={[styles.mapPoint, styles.mapPointBottom]} />
      <View style={styles.mapLabelTop}><Text style={styles.mapLabelText}>{topLabel}</Text></View>
      <View style={styles.mapLabelBottom}><Text style={styles.mapLabelText}>{bottomLabel}</Text></View>
      <View style={styles.mapSample}><Text style={styles.mapSampleText}>SAMPLE MAP</Text></View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    mapPreview: { height: 174, backgroundColor: colors.mapSea, borderRadius: radius.lg, overflow: 'hidden', position: 'relative' },
    mapIsland: { position: 'absolute', width: 120, height: 230, backgroundColor: colors.mapLand, borderRadius: 70, left: '38%', top: -23, transform: [{ rotate: '32deg' }] },
    mapRoadOne: { position: 'absolute', height: 1, backgroundColor: 'rgba(255,255,255,0.72)', width: 250, top: 62, left: 10, transform: [{ rotate: '21deg' }] },
    mapRoadTwo: { position: 'absolute', height: 1, backgroundColor: 'rgba(255,255,255,0.72)', width: 230, top: 120, left: 65, transform: [{ rotate: '-32deg' }] },
    mapRoute: { position: 'absolute', height: 4, width: 132, borderRadius: 4, backgroundColor: colors.green, left: '32%', top: '50%', transform: [{ rotate: '63deg' }] },
    mapPoint: { position: 'absolute', width: 14, height: 14, borderRadius: 8, backgroundColor: colors.lime, borderWidth: 3, borderColor: colors.green },
    mapPointTop: { left: '46%', top: 27 },
    mapPointBottom: { left: '62%', bottom: 26 },
    mapLabelTop: { position: 'absolute', left: '49%', top: 20, backgroundColor: colors.mapLabel, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 7 },
    mapLabelBottom: { position: 'absolute', left: '66%', bottom: 21, backgroundColor: colors.mapLabel, paddingHorizontal: 7, paddingVertical: 4, borderRadius: 7 },
    mapLabelText: { color: colors.greenDark, fontSize: 8, fontWeight: '900', letterSpacing: 0.5 },
    mapSample: { position: 'absolute', left: 11, bottom: 10, backgroundColor: colors.mapSampleBg, borderRadius: 8, paddingVertical: 5, paddingHorizontal: 7 },
    mapSampleText: { color: colors.muted, fontSize: 7, fontWeight: '900', letterSpacing: 0.8 },
  });
}
