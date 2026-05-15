import { StyleSheet, Text, View, type ViewStyle } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Line,
  LinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Stop,
  G,
} from 'react-native-svg';
import { colors } from '@/constants/colors';

interface LogoProps {
  size?: number;
  style?: ViewStyle;
}

/** Just the shield + gauge icon — useful for headers, splash, etc. */
export function LogoMark({ size = 64, style }: LogoProps) {
  return (
    <View style={style}>
      <Svg width={size} height={size} viewBox="0 0 256 256">
        <Defs>
          <LinearGradient id="lm_shieldFill" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#1A2030" />
            <Stop offset="1" stopColor="#0B0F1A" />
          </LinearGradient>
          <LinearGradient id="lm_shieldStroke" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor="#3B82F6" />
            <Stop offset="1" stopColor="#60A5FA" />
          </LinearGradient>
          <LinearGradient id="lm_arcGrad" x1="0" y1="1" x2="1" y2="0">
            <Stop offset="0" stopColor="#3B82F6" />
            <Stop offset="0.55" stopColor="#60A5FA" />
            <Stop offset="1" stopColor="#FB7185" />
          </LinearGradient>
          <RadialGradient id="lm_hubGlow" cx="0.5" cy="0.5" r="0.5">
            <Stop offset="0" stopColor="#60A5FA" stopOpacity={0.55} />
            <Stop offset="1" stopColor="#60A5FA" stopOpacity={0} />
          </RadialGradient>
        </Defs>

        {/* Shield */}
        <Path
          d="M128 16 L222 50 V126 C222 178 184 218 128 240 C72 218 34 178 34 126 V50 Z"
          fill="url(#lm_shieldFill)"
          stroke="url(#lm_shieldStroke)"
          strokeWidth={4}
          strokeLinejoin="round"
        />

        {/* Halo */}
        <Circle cx={128} cy={120} r={64} fill="url(#lm_hubGlow)" />

        {/* Gauge track */}
        <Path
          d="M 79.4 169.5 A 70 70 0 1 1 176.6 169.5"
          stroke="#1F2740"
          strokeWidth={14}
          strokeLinecap="round"
          fill="none"
        />

        {/* Gauge progress */}
        <Path
          d="M 79.4 169.5 A 70 70 0 1 1 184.3 75.2"
          stroke="url(#lm_arcGrad)"
          strokeWidth={10}
          strokeLinecap="round"
          fill="none"
        />

        {/* Tick marks */}
        <G stroke="#60A5FA" strokeWidth={2} strokeLinecap="round" opacity={0.55}>
          <Line x1={65} y1={155} x2={73} y2={162} />
          <Line x1={60} y1={120} x2={70} y2={120} />
          <Line x1={80} y1={70} x2={86} y2={78} />
          <Line x1={128} y1={50} x2={128} y2={60} />
          <Line x1={176} y1={70} x2={170} y2={78} />
          <Line x1={196} y1={120} x2={186} y2={120} />
          <Line x1={191} y1={155} x2={183} y2={162} />
        </G>

        {/* Needle */}
        <G x={128} y={120}>
          <Polygon points="-3,6 3,6 1,-54 -1,-54" fill="#FFFFFF" rotation={50} />
        </G>

        {/* Hub */}
        <Circle cx={128} cy={120} r={11} fill="#0B0F1A" stroke="#60A5FA" strokeWidth={2} />
        <Circle cx={128} cy={120} r={4.5} fill="#FFFFFF" />

        {/* Live pulse dot */}
        <Circle cx={200} cy={210} r={11} fill="#10B981" opacity={0.25} />
        <Circle cx={200} cy={210} r={6} fill="#10B981" />
      </Svg>
    </View>
  );
}

interface LogoFullProps {
  size?: number;
  showTagline?: boolean;
  style?: ViewStyle;
}

/** Full logo: icon + wordmark + optional tagline. */
export function Logo({ size = 96, showTagline = true, style }: LogoFullProps) {
  return (
    <View style={[styles.wrap, style]}>
      <LogoMark size={size} />
      <Text style={[styles.wordmark, { fontSize: size * 0.28, marginTop: size * 0.08 }]}>
        <Text style={{ color: colors.text }}>Guardian</Text>
        <Text style={{ color: colors.primaryGlow }}>Dash</Text>
      </Text>
      {showTagline ? (
        <Text style={[styles.tagline, { fontSize: Math.max(9, size * 0.1) }]}>
          SMART DRIVING · SAFER LIVES
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
  wordmark: { fontWeight: '800', letterSpacing: 0.5 },
  tagline: {
    color: colors.textDim,
    fontWeight: '600',
    letterSpacing: 3,
    marginTop: 4,
  },
});
