import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Asset } from 'expo-asset';
import { WebView, type WebViewMessageEvent } from 'react-native-webview';

import { fetchPublicTerminals, subscribePublicTerminals } from '../lib/terminals';
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- WebView's generic P=undefined breaks JSX ref inference
  const webRef = useRef<any>(null);
  const [uri, setUri] = useState<string | null>(mapAsset.localUri);

  // Push live terminal rows into the embedded map; re-push on DB changes.
  const pushTerminals = useCallback(async (): Promise<void> => {
    const terminals = await fetchPublicTerminals();
    webRef.current?.postMessage(JSON.stringify({ type: 'egabay:terminals', terminals }));
  }, []);

  useEffect(() => subscribePublicTerminals(pushTerminals), [pushTerminals]);

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
          ref={webRef}
          source={{ uri: `${uri}#${fullscreen ? 'full' : 'embed'}` }}
          style={styles.webview}
          originWhitelist={['*']}
          allowFileAccess
          javaScriptEnabled
          domStorageEnabled
          scrollEnabled={false}
          setSupportMultipleWindows={false}
          onMessage={(event: WebViewMessageEvent): void => {
            if (event.nativeEvent.data === 'egabay:expand') onExpand?.();
            if (event.nativeEvent.data === 'egabay:ready') void pushTerminals();
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
