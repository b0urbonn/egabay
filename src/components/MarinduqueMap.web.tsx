import { useCallback, useEffect, useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { Asset } from 'expo-asset';

import { fetchPublicTerminals, subscribePublicTerminals } from '../lib/terminals';
import { useThemeStyles } from '../lib/theme';
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
  const frameRef = useRef<HTMLIFrameElement | null>(null);

  // Push live terminal rows into the embedded map; re-push on DB changes.
  const pushTerminals = useCallback(async () => {
    const terminals = await fetchPublicTerminals();
    frameRef.current?.contentWindow?.postMessage(
      JSON.stringify({ type: 'egabay:terminals', terminals }),
      '*',
    );
  }, []);

  useEffect(() => subscribePublicTerminals(pushTerminals), [pushTerminals]);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data === 'egabay:expand') onExpand?.();
      if (event.data === 'egabay:ready') void pushTerminals();
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onExpand, pushTerminals]);

  return (
    <View style={[styles.wrap, fullscreen ? styles.fullscreen : [styles.card, { height }]]}>
      <iframe
        ref={frameRef}
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
