import { useRouter } from 'expo-router';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import AppHeader from '../components/AppHeader';
import GradientText from '../components/GradientText';
import ToolCard from '../components/ToolCard';
import { TOOLS } from '../constants/tools';
import { useTheme } from '../theme';

const data = TOOLS.length % 2 === 0 ? TOOLS : [...TOOLS, { id: '__spacer' } as any];

export default function Home() {
  const { theme } = useTheme();
  const router = useRouter();

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <AppHeader />
      <FlatList
        data={TOOLS}
        numColumns={2}
        keyExtractor={(t) => t.id}
        columnWrapperStyle={{ gap: 14 }}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={{ marginBottom: 20 }}>
            <GradientText style={[styles.h1, { color: theme.text }]}>Image Utilities</GradientText>
            <Text style={{ color: theme.textMuted, fontSize: 15, marginTop: 4 }}>Making image processing easy!</Text>
          </View>
        }
        renderItem={({ item }) =>
          item.id === '__spacer' ? (
            <View style={{ flex: 1 }} />
          ) : (
            <ToolCard tool={item} onPress={() => item.route && router.push(item.route as any)} />
          )
        }
      />
    </View>
  );
}




const styles = StyleSheet.create({
  list: { paddingHorizontal: 20, paddingBottom: 40, gap: 14 },
  h1: { fontSize: 30, fontWeight: '800' },
});