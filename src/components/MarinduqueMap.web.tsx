import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Asset } from 'expo-asset';

import { useThemeStyles } from '../lib/theme';
import { radius, type ThemeColors } from '../theme';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mapAsset = Asset.fromModule(require('../../assets/marinduque-map.html'));

type MarinduqueMapProps = {
  height?: number;
  /** Fill the parent edge-to-edge (no card chrome). */
  fullscreen?: boolean;
  /** Called when the expand control inside the embedded map is tapped. */
  onExpand?: () => void;
};

export function MarinduqueMap({ height = 300, fullscreen = false, onExpand }: MarinduqueMapProps) {
  const styles = useThemeStyles(createStyles);

  useEffect(() => {
    if (!onExpand) return;
    const handler = (event: MessageEvent) => {
      if (event.data === 'egabay:expand') onExpand();
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onExpand]);

  return (
    <View style={[styles.wrap, fullscreen ? styles.fullscreen : [styles.card, { height }]]}>
      <iframe
        src={`${mapAsset.uri}#${fullscreen ? 'full' : 'embed'}`}
        title="Marinduque map"
        allow="geolocation"
        style={{ border: 0, width: '100%', height: '100%', display: 'block' }}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: { backgroundColor: colors.mapSea },
    card: { borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
    fullscreen: { flex: 1 },
  });
}
