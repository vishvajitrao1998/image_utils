import { useRouter } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import type { LegalSection } from '../constants/legal';
import { useTheme } from '../theme';
import AppHeader from './AppHeader';

export default function LegalScreen({
  title, updated, sections,
}: { title: string; updated: string; sections: LegalSection[] }) {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <AppHeader title={title} onBack={() => router.back()} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={{ color: theme.textMuted, fontSize: 13 }}>Last updated: {updated}</Text>

        {sections.map((s) => (
          <View key={s.heading} style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Text style={{ color: theme.text, fontSize: 16, fontWeight: '700' }}>{s.heading}</Text>
            <Text style={{ color: theme.textMuted, fontSize: 14, lineHeight: 21, marginTop: 8 }}>{s.body}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingBottom: 48, gap: 14 },
  card: { borderRadius: 20, borderWidth: 1, padding: 18 },
});