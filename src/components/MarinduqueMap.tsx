import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Asset } from 'expo-asset';
import { WebView } from 'react-native-webview';

import { useColors, useThemeStyles } from '../lib/theme';
import { radius, type ThemeColors } from '../theme';

// eslint-disable-next-line @typescript-eslint/no-var-requires
const mapAsset = Asset.fromModule(require('../../assets/generated/marinduque-map.html'));

type MarinduqueMapProps = {
  height?: number;
  /** Fill the parent edge-to-edge (no card chrome). */
  fullscreen?: boolean;
  /** Called when the expand control inside the embedded map is tapped. */
  onExpand?: () => void;
};

export function MarinduqueMap({ height = 300, fullscreen = false, onExpand }: MarinduqueMapProps) {
  const styles = useThemeStyles(createStyles);
  const colors = useColors();
  const [uri, setUri] = useState<string | null>(mapAsset.localUri);

  useEffect(() => {
    let mounted = true;
    if (!mapAsset.localUri) {
      mapAsset.downloadAsync().then(() => {
        if (mounted) setUri(mapAsset.localUri ?? null);
      });
    }
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <View style={[styles.wrap, fullscreen ? styles.fullscreen : [styles.card, { height }]]}>
      {uri ? (
        <WebView
          source={{ uri: `${uri}#${fullscreen ? 'full' : 'embed'}` }}
          style={styles.webview}
          originWhitelist={['*']}
          allowFileAccess
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          setSupportMultipleWindows={false}
          onMessage={(event) => {
            if (event.nativeEvent.data === 'egabay:expand') onExpand?.();
          }}
        />
      ) : (
        <View style={styles.loading}>
          <ActivityIndicator color={colors.green} />
        </View>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: { backgroundColor: colors.mapSea },
    card: { borderRadius: radius.lg, overflow: 'hidden', borderWidth: 1, borderColor: colors.line },
    fullscreen: { flex: 1 },
    webview: { flex: 1, backgroundColor: 'transparent' },
    loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  });
}
