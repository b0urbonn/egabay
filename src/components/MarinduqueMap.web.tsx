import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Asset } from 'expo-asset';

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

const styles = StyleSheet.create({
  wrap: { backgroundColor: '#aad3df' },
  card: { borderRadius: 19, overflow: 'hidden', borderWidth: 1, borderColor: '#E5EAE4' },
  fullscreen: { flex: 1 },
});
