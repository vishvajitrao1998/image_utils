import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { gradient } from '../theme';

type Props = {
  label: string;
  onPress: () => void;
  icon?: React.ComponentProps<typeof Ionicons>['name'];
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

export default function GradientButton({
  label, onPress, icon, iconPosition = 'left', loading, disabled, style,
}: Props) {
  const off = disabled || loading;

  const iconEl = icon ? <Ionicons name={icon} size={20} color="#fff" /> : null;

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
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            {iconPosition === 'left' && iconEl}
            <Text style={styles.label}>{label}</Text>
            {iconPosition === 'right' && iconEl}
          </>
        )}
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
  },
  label: { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.3 },
});