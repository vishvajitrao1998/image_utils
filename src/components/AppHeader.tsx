import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BRAND } from '../constants/tools';
import { useTheme } from '../theme';
import BrandMark from './BrandMark';
import GradientText from './GradientText';

type Props = {
  title?: string;
  onBack?: () => void;
  showSettings?: boolean; // by default only the home header shows it
};

export default function AppHeader({ title, onBack, showSettings = !onBack }: Props) {
  const { theme, toggle } = useTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const roundBtn = [styles.roundBtn, { backgroundColor: theme.surface, borderColor: theme.border }];

  return (
    <View style={[styles.row, { paddingTop: insets.top + 12 }]}>
      {onBack ? (
        <View style={styles.left}>
          <Pressable onPress={onBack} hitSlop={8} style={roundBtn}>
            <Ionicons name="chevron-back" size={22} color={theme.text} />
          </Pressable>
          <GradientText style={styles.title}>{title}</GradientText>
        </View>
      ) : (
        <View style={styles.left}>
          <BrandMark size={36} />
          <GradientText style={styles.title}>{BRAND.name}</GradientText>
        </View>
      )}

      <View style={styles.right}>
        {showSettings && (
          <Pressable onPress={() => router.push('/settings')} hitSlop={8} style={roundBtn}>
            <Ionicons name="settings-outline" size={20} color={theme.text} />
          </Pressable>
        )}
        <Pressable onPress={toggle} hitSlop={8} style={roundBtn}>
          <Ionicons name={theme.mode === 'dark' ? 'sunny-outline' : 'moon-outline'} size={20} color={theme.text} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingBottom: 12 },
  left: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  right: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  title: { fontSize: 20, fontWeight: '800', letterSpacing: 0.3 },
  roundBtn: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});