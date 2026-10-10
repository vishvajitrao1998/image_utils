import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { FlatList, Keyboard, StyleSheet, Text, View } from 'react-native';

import AppHeader from '../components/AppHeader';
import GradientText from '../components/GradientText';
import SearchBar from '../components/SearchBar';
import ToolCard from '../components/ToolCard';
import { TOOLS } from '../constants/tools';
import { useTheme } from '../theme';

export default function Home() {
  const { theme } = useTheme();
  const router = useRouter();
  const [query, setQuery] = useState('');

  const q = query.trim().toLowerCase();

  const filtered = useMemo(
    () =>
      q
        ? TOOLS.filter(
            (t) => t.title.toLowerCase().includes(q) || t.subtitle.toLowerCase().includes(q)
          )
        : TOOLS,
    [q]
  );

  // Keeps a lone card in the last row at half width instead of stretching
  const data = filtered.length % 2 === 0 ? filtered : [...filtered, { id: '__spacer' } as any];

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <AppHeader />

      <View style={styles.top}>
        <View style={styles.titleRow}>
          <GradientText style={styles.h1}>Image tools</GradientText>
          <Text style={{ color: theme.textMuted, fontSize: 14 }}>
            {filtered.length} {filtered.length === 1 ? 'tool' : 'tools'}
          </Text>
        </View>
        <SearchBar value={query} onChangeText={setQuery} placeholder="Search tools, e.g. crop or sketch" />
      </View>

      <FlatList
        data={data}
        numColumns={2}
        keyExtractor={(t) => t.id}
        columnWrapperStyle={{ gap: 14 }}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) =>
          item.id === '__spacer' ? (
            <View style={{ flex: 1 }} />
          ) : (
            <ToolCard
              tool={item}
              onPress={() => {
                Keyboard.dismiss();
                if (item.route) router.push(item.route as any);
              }}
            />
          )
        }
        ListEmptyComponent={
          <View style={styles.empty}>
            <View style={[styles.emptyIcon, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="search-outline" size={28} color={theme.textMuted} />
            </View>
            <Text style={{ color: theme.text, fontSize: 17, fontWeight: '700', marginTop: 16 }}>No tools found</Text>
            <Text style={{ color: theme.textMuted, marginTop: 6, textAlign: 'center' }}>
              Nothing matches "{query.trim()}". Try a different name.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  top: { paddingHorizontal: 20, paddingBottom: 16, gap: 14 },
  titleRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' },
  h1: { fontSize: 30, fontWeight: '800' },
  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 14 },
  empty: { alignItems: 'center', paddingTop: 60, paddingHorizontal: 20 },
  emptyIcon: { width: 68, height: 68, borderRadius: 22, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});