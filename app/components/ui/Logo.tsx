import { Image, StyleSheet, View, type ViewStyle } from 'react-native';

const LOGO = require('@/assets/logo.png');

interface LogoProps {
  size?: number;
  style?: ViewStyle;
}

/** Logo mark — just the icon. */
export function LogoMark({ size = 64, style }: LogoProps) {
  return (
    <View style={[{ width: size, height: size }, style]}>
      <Image source={LOGO} style={{ width: size, height: size, resizeMode: 'contain' }} />
    </View>
  );
}

interface LogoFullProps {
  size?: number;
  style?: ViewStyle;
}

/** Full logo — the icon already includes the wordmark + tagline. */
export function Logo({ size = 180, style }: LogoFullProps) {
  return (
    <View style={[styles.wrap, style]}>
      <Image source={LOGO} style={{ width: size, height: size, resizeMode: 'contain' }} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center' },
});
