import { useMemo } from 'react';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop, Line as SvgLine, Text as SvgText } from 'react-native-svg';
import { colors } from '@/constants/colors';

interface Series {
  label: string;
  color: string;
  values: number[];
}

interface Props {
  title: string;
  subtitle?: string;
  series: Series[];
  min?: number;
  max?: number;
  unit?: string;
  height?: number;
  windowSize?: number;
  /** Optional reference line (e.g. threshold) drawn across the chart. */
  reference?: { value: number; color?: string; label?: string };
}

const PAD_L = 38;
const PAD_R = 12;
const PAD_T = 14;
const PAD_B = 18;

export function LiveChart({
  title,
  subtitle,
  series,
  min,
  max,
  unit,
  height = 130,
  windowSize = 100,
  reference,
}: Props) {
  const { width: winW } = useWindowDimensions();
  const width = Math.min(winW - 40, 500);

  const sliced = series.map((s) => ({
    ...s,
    values: s.values.slice(-windowSize),
  }));

  const valuesFlat = sliced.flatMap((s) => s.values);
  const autoMin = valuesFlat.length > 0 ? Math.min(...valuesFlat) : 0;
  const autoMax = valuesFlat.length > 0 ? Math.max(...valuesFlat) : 1;
  const yMin = min ?? Math.min(autoMin, reference?.value ?? autoMin);
  let yMax = max ?? Math.max(autoMax, reference?.value ?? autoMax);
  if (yMax - yMin < 0.1) yMax = yMin + 0.1; // avoid divide-by-zero

  const plotW = width - PAD_L - PAD_R;
  const plotH = height - PAD_T - PAD_B;

  const x = (i: number, n: number) =>
    PAD_L + (n <= 1 ? plotW : (i / (n - 1)) * plotW);
  const y = (v: number) => PAD_T + (1 - (v - yMin) / (yMax - yMin)) * plotH;

  const paths = useMemo(
    () =>
      sliced.map((s) => {
        if (s.values.length === 0) return '';
        return s.values
          .map((v, i) => `${i === 0 ? 'M' : 'L'} ${x(i, s.values.length).toFixed(1)} ${y(v).toFixed(1)}`)
          .join(' ');
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sliced, yMin, yMax],
  );

  const last = sliced[0]?.values?.[sliced[0].values.length - 1];

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>{title}</Text>
          {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
        </View>
        {last != null && (
          <Text style={[styles.lastValue, { color: sliced[0]?.color ?? colors.text }]}>
            {last.toFixed(2)}{unit ? ` ${unit}` : ''}
          </Text>
        )}
      </View>

      <Svg width={width} height={height}>
        <Defs>
          <LinearGradient id={`fade-${title}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={sliced[0]?.color ?? colors.primary} stopOpacity={0.35} />
            <Stop offset="1" stopColor={sliced[0]?.color ?? colors.primary} stopOpacity={0} />
          </LinearGradient>
        </Defs>

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

        <SvgText x={PAD_L - 6} y={PAD_T + 4} fill={colors.textMuted} fontSize={9} textAnchor="end">
          {yMax.toFixed(1)}
        </SvgText>
        <SvgText x={PAD_L - 6} y={PAD_T + plotH + 4} fill={colors.textMuted} fontSize={9} textAnchor="end">
          {yMin.toFixed(1)}
        </SvgText>

        {reference && (
          <SvgLine
            x1={PAD_L}
            x2={PAD_L + plotW}
            y1={y(reference.value)}
            y2={y(reference.value)}
            stroke={reference.color ?? colors.danger}
            strokeWidth={1}
            strokeDasharray="4,3"
            opacity={0.7}
          />
        )}

        {paths[0] && sliced[0]?.values?.length > 1 && (
          <Path
            d={`${paths[0]} L ${x(sliced[0].values.length - 1, sliced[0].values.length).toFixed(1)} ${(PAD_T + plotH).toFixed(1)} L ${PAD_L} ${(PAD_T + plotH).toFixed(1)} Z`}
            fill={`url(#fade-${title})`}
          />
        )}

        {paths.map((d, i) => (
          <Path
            key={i}
            d={d}
            stroke={sliced[i].color}
            strokeWidth={2}
            fill="none"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        ))}
      </Svg>

      {sliced.length > 1 && (
        <View style={styles.legend}>
          {sliced.map((s) => (
            <View key={s.label} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: s.color }]} />
              <Text style={styles.legendText}>{s.label}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bgElevated,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 },
  title: { color: colors.text, fontSize: 13, fontWeight: '700' },
  subtitle: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  lastValue: { fontSize: 16, fontWeight: '800', fontVariant: ['tabular-nums'] },
  legend: { flexDirection: 'row', gap: 14, marginTop: 4 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: colors.textMuted, fontSize: 10 },
});
