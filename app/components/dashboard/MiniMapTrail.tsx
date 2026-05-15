import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import { colors } from '@/constants/colors';
import { TileMap } from '@/components/map/TileMap';
import type { TelemetryFrame } from '@/types/telemetry.types';

export function MiniMapTrail({ frames }: { frames: TelemetryFrame[] }) {
  const { width: winW } = useWindowDimensions();
  const W = Math.min(winW - 40, 500);
  const H = 180;
  const last = frames[frames.length - 1];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>📍 LIVE LOCATION</Text>
        <Text style={styles.coords}>
          {last ? `${last.location.lat.toFixed(4)}, ${last.location.lng.toFixed(4)}` : 'No GPS'}
        </Text>
      </View>
      <View style={{ alignItems: 'center' }}>
        <TileMap
          center={last?.location ?? { lat: 30.0444, lng: 31.2357 }}
          zoom={16}
          width={W}
          height={H}
          path={frames.map((f) => f.location)}
          markers={last ? [{ lat: last.location.lat, lng: last.location.lng, color: colors.primary }] : []}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  label: { color: colors.textMuted, fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  coords: { color: colors.textMuted, fontSize: 11, fontVariant: ['tabular-nums'] },
});
