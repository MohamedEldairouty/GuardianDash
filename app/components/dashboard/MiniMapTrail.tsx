import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { colors } from '@/constants/colors';
import type { TelemetryFrame } from '@/types/telemetry.types';

const W = 320;
const H = 140;
const PAD = 12;

export function MiniMapTrail({ frames }: { frames: TelemetryFrame[] }) {
  const points = frames.map((f) => f.location);

  let pathD = '';
  let lastX = W / 2;
  let lastY = H / 2;

  if (points.length >= 2) {
    const lats = points.map((p) => p.lat);
    const lngs = points.map((p) => p.lng);
    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLng = Math.min(...lngs);
    const maxLng = Math.max(...lngs);
    const dLat = Math.max(1e-6, maxLat - minLat);
    const dLng = Math.max(1e-6, maxLng - minLng);

    const xs = (lng: number) => PAD + ((lng - minLng) / dLng) * (W - PAD * 2);
    const ys = (lat: number) => PAD + (1 - (lat - minLat) / dLat) * (H - PAD * 2);

    pathD = points
      .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xs(p.lng).toFixed(1)} ${ys(p.lat).toFixed(1)}`)
      .join(' ');

    lastX = xs(points[points.length - 1].lng);
    lastY = ys(points[points.length - 1].lat);
  }

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.label}>📍 LIVE TRAIL</Text>
        <Text style={styles.coords}>
          {points.length
            ? `${points[points.length - 1].lat.toFixed(4)}, ${points[points.length - 1].lng.toFixed(4)}`
            : 'No GPS'}
        </Text>
      </View>

      <Svg width="100%" height={H} viewBox={`0 0 ${W} ${H}`}>
        <Defs>
          <LinearGradient id="grid" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.surface} stopOpacity="0.6" />
            <Stop offset="1" stopColor={colors.bg} stopOpacity="0" />
          </LinearGradient>
        </Defs>

        {/* Grid lines */}
        {[0.25, 0.5, 0.75].map((t) => (
          <Path
            key={`h${t}`}
            d={`M 0 ${H * t} L ${W} ${H * t}`}
            stroke={colors.border}
            strokeWidth={0.5}
            opacity={0.5}
          />
        ))}
        {[0.25, 0.5, 0.75].map((t) => (
          <Path
            key={`v${t}`}
            d={`M ${W * t} 0 L ${W * t} ${H}`}
            stroke={colors.border}
            strokeWidth={0.5}
            opacity={0.5}
          />
        ))}

        {pathD ? (
          <>
            <Path d={pathD} stroke={colors.primaryGlow} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx={lastX} cy={lastY} r={10} fill={colors.primary} opacity={0.25} />
            <Circle cx={lastX} cy={lastY} r={5} fill={colors.primaryGlow} />
            <Circle cx={lastX} cy={lastY} r={2} fill={colors.text} />
          </>
        ) : (
          <Circle cx={W / 2} cy={H / 2} r={4} fill={colors.textDim} />
        )}
      </Svg>
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
    overflow: 'hidden',
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { color: colors.textMuted, fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  coords: { color: colors.textMuted, fontSize: 11, fontVariant: ['tabular-nums'] },
});
