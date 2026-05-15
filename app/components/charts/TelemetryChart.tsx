import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop, Line as SvgLine, Circle, Text as SvgText } from 'react-native-svg';
import { colors } from '@/constants/colors';
import type { TelemetryFrame } from '@/types/telemetry.types';

interface Props {
  frames: TelemetryFrame[];
  width: number;
  height?: number;
  /** Index of the moment to mark with a vertical line (e.g. the crash). */
  markerIndex?: number;
}

const PAD_L = 36;
const PAD_R = 12;
const PAD_T = 14;
const PAD_B = 22;

export function TelemetryChart({ frames, width, height = 200, markerIndex }: Props) {
  if (!frames.length) {
    return (
      <View style={[styles.empty, { width, height }]}>
        <Text style={styles.emptyText}>No telemetry recorded</Text>
      </View>
    );
  }

  const plotW = width - PAD_L - PAD_R;
  const plotH = height - PAD_T - PAD_B;

  const maxSpeed = Math.max(60, ...frames.map((f) => f.speedKph));
  const maxG = Math.max(3, ...frames.map((f) => f.gForce));

  const x = (i: number) => PAD_L + (i / Math.max(1, frames.length - 1)) * plotW;
  const ySpeed = (v: number) => PAD_T + (1 - v / maxSpeed) * plotH;
  const yG = (v: number) => PAD_T + (1 - v / maxG) * plotH;

  const speedPath = frames.map((f, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${ySpeed(f.speedKph).toFixed(1)}`).join(' ');
  const gPath = frames.map((f, i) => `${i === 0 ? 'M' : 'L'} ${x(i).toFixed(1)} ${yG(f.gForce).toFixed(1)}`).join(' ');
  const speedFill =
    speedPath +
    ` L ${x(frames.length - 1).toFixed(1)} ${PAD_T + plotH} L ${PAD_L} ${PAD_T + plotH} Z`;

  return (
    <View>
      <View style={styles.legend}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.primaryGlow }]} />
          <Text style={styles.legendText}>Speed (km/h)</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: colors.danger }]} />
          <Text style={styles.legendText}>G-force</Text>
        </View>
      </View>

      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id="tc_speedFill" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.primary} stopOpacity={0.4} />
            <Stop offset="1" stopColor={colors.primary} stopOpacity={0} />
          </LinearGradient>
        </Defs>

        {/* Y-axis grid */}
        {[0.25, 0.5, 0.75].map((t) => (
          <SvgLine
            key={`grid-${t}`}
            x1={PAD_L}
            x2={PAD_L + plotW}
            y1={PAD_T + plotH * t}
            y2={PAD_T + plotH * t}
            stroke={colors.border}
            strokeWidth={0.5}
            strokeDasharray="3,3"
          />
        ))}

        {/* Y-axis labels (speed) */}
        <SvgText x={PAD_L - 6} y={PAD_T + 4} fill={colors.textMuted} fontSize={9} textAnchor="end">{Math.round(maxSpeed)}</SvgText>
        <SvgText x={PAD_L - 6} y={PAD_T + plotH / 2 + 4} fill={colors.textMuted} fontSize={9} textAnchor="end">{Math.round(maxSpeed / 2)}</SvgText>
        <SvgText x={PAD_L - 6} y={PAD_T + plotH + 4} fill={colors.textMuted} fontSize={9} textAnchor="end">0</SvgText>

        {/* Speed area + line */}
        <Path d={speedFill} fill="url(#tc_speedFill)" />
        <Path d={speedPath} stroke={colors.primaryGlow} strokeWidth={2} fill="none" strokeLinejoin="round" />

        {/* G-force line */}
        <Path d={gPath} stroke={colors.danger} strokeWidth={2} fill="none" strokeLinejoin="round" />

        {/* Crash marker */}
        {typeof markerIndex === 'number' && markerIndex >= 0 && markerIndex < frames.length ? (
          <>
            <SvgLine
              x1={x(markerIndex)}
              x2={x(markerIndex)}
              y1={PAD_T}
              y2={PAD_T + plotH}
              stroke={colors.danger}
              strokeWidth={1.5}
              strokeDasharray="4,3"
            />
            <Circle cx={x(markerIndex)} cy={yG(frames[markerIndex].gForce)} r={5} fill={colors.danger} />
          </>
        ) : null}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  empty: { alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface, borderRadius: 14 },
  emptyText: { color: colors.textMuted, fontSize: 12 },
  legend: { flexDirection: 'row', gap: 16, marginBottom: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: colors.textMuted, fontSize: 11 },
});
