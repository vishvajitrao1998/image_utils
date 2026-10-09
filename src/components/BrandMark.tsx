import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { gradient } from '../theme';

export default function BrandMark({ size = 96 }: { size?: number }) {
  return (
    <LinearGradient
      colors={gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={{ width: size, height: size, borderRadius: size * 0.3, alignItems: 'center', justifyContent: 'center' }}
    >
      <Ionicons name="images" size={size * 0.5} color="#fff" />
    </LinearGradient>
  );
}