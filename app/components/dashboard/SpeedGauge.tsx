import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';
import Animated, {
  useAnimatedProps,
  useSharedValue,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { colors } from '@/constants/colors';
import { SPEED } from '@/constants/thresholds';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SIZE = 240;
const STROKE = 14;
const RADIUS = (SIZE - STROKE) / 2;
const CIRC = 2 * Math.PI * RADIUS;
// 270° arc, leave bottom 90° empty
const ARC_FRACTION = 0.75;
const ARC_LEN = CIRC * ARC_FRACTION;

export function SpeedGauge({ speedKph }: { speedKph: number }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const target = Math.min(1, Math.max(0, speedKph / SPEED.maxDisplay));
    progress.value = withTiming(target, { duration: 350, easing: Easing.out(Easing.cubic) });
  }, [speedKph, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: CIRC - ARC_LEN * progress.value,
  }));

  return (
    <View style={styles.wrap}>
      <Svg width={SIZE} height={SIZE} style={styles.svg}>
        <Defs>
          <LinearGradient id="gauge" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={colors.primary} />
            <Stop offset="0.5" stopColor={colors.primaryGlow} />
            <Stop offset="1" stopColor={colors.dangerGlow} />
          </LinearGradient>
        </Defs>
        {/* Track */}
        <Circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke={colors.border}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${ARC_LEN} ${CIRC}`}
          strokeDashoffset={0}
          fill="none"
        />
        {/* Progress */}
        <AnimatedCircle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          stroke="url(#gauge)"
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={`${ARC_LEN} ${CIRC}`}
          animatedProps={animatedProps}
          fill="none"
        />
      </Svg>
      <View style={styles.center} pointerEvents="none">
        <Text style={styles.label}>SPEED</Text>
        <Text style={styles.value}>{Math.round(speedKph)}</Text>
        <Text style={styles.unit}>km/h</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: SIZE, height: SIZE, alignItems: 'center', justifyContent: 'center' },
  svg: { transform: [{ rotate: '135deg' }] },
  center: { position: 'absolute', alignItems: 'center' },
  label: { color: colors.textMuted, fontSize: 11, letterSpacing: 2, fontWeight: '700' },
  value: { color: colors.text, fontSize: 78, fontWeight: '200', lineHeight: 86, fontVariant: ['tabular-nums'] },
  unit: { color: colors.textMuted, fontSize: 13, marginTop: -4 },
});
