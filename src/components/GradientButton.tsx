import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { gradient } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function GradientButton({ label, onPress, loading, disabled, style }: Props) {
  const off = disabled || loading;
  return (
    <Pressable
      disabled={off}
      onPress={onPress}
      style={({ pressed }) => [
        { opacity: off ? 0.5 : pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.98 : 1 }] },
        style,
      ]}
    >
      <LinearGradient colors={gradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.btn}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.label}>{label}</Text>}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { paddingVertical: 16, paddingHorizontal: 40, borderRadius: 16, alignItems: 'center', justifyContent: 'center', minHeight: 56 },
  label: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
});