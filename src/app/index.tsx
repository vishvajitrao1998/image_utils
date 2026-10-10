import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import BrandMark from '../components/BrandMark';
import GradientButton from '../components/GradientButton';
import GradientText from '../components/GradientText';
import { BRAND } from '../constants/tools';
import { useTheme } from '../theme';
export default function Splash() {
  const { theme } = useTheme();
  const router = useRouter();

  const logoScale = useRef(new Animated.Value(0.4)).current;
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoTilt = useRef(new Animated.Value(0)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textShift = useRef(new Animated.Value(16)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.parallel([
        Animated.spring(logoScale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
        Animated.timing(logoOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(logoTilt, { toValue: 1, duration: 900, easing: Easing.out(Easing.back(1.6)), useNativeDriver: true }),
      ]),
      Animated.parallel([
        Animated.timing(textOpacity, { toValue: 1, duration: 450, useNativeDriver: true }),
        Animated.timing(textShift, { toValue: 0, duration: 450, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
      Animated.timing(btnOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const rotate = logoTilt.interpolate({ inputRange: [0, 1], outputRange: ['-18deg', '0deg'] });

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }, { rotate }] }}>
        <BrandMark size={112} />
      </Animated.View>

      <Animated.View
        style={{ opacity: textOpacity, transform: [{ translateY: textShift }], alignItems: 'center', marginTop: 28 }}
      >
        <GradientText style={styles.brand}>{BRAND.name}</GradientText>
        <Text style={[styles.tagline, { color: theme.textMuted }]}>{BRAND.tagline}</Text>
      </Animated.View>

      <Animated.View style={{ opacity: btnOpacity, marginTop: 40 }}>
      <GradientButton
          label="Let's Start"
          icon="arrow-forward"
          iconPosition="right"
          onPress={() => router.replace('/home')}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 },
  brand: { fontSize: 38, fontWeight: '800', letterSpacing: 0.5 },
  tagline: { fontSize: 16, marginTop: 8, textAlign: 'center', maxWidth: 280, lineHeight: 22 },
});