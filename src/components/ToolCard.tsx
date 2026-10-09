import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Tool } from '../constants/tools';
import { useTheme } from '../theme';

export default function ToolCard({ tool, onPress }: { tool: Tool; onPress: () => void }) {
  const { theme } = useTheme();
  const soon = !tool.route;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: theme.surface, borderColor: theme.border, opacity: soon ? 0.6 : pressed ? 0.85 : 1 },
      ]}
    >
      <View style={[styles.iconTile, { backgroundColor: theme.surfaceAlt }]}>
        <Ionicons name={tool.icon} size={26} color={theme.text} />
      </View>
      <Text style={[styles.title, { color: theme.text }]}>{tool.title}</Text>
      <Text style={[styles.sub, { color: theme.textMuted }]}>{soon ? 'Coming soon' : tool.subtitle}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: 22, borderWidth: 1, padding: 18, minHeight: 150, justifyContent: 'flex-end' },
  iconTile: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 'auto' },
  title: { fontSize: 17, fontWeight: '700', marginTop: 14 },
  sub: { fontSize: 13, marginTop: 2 },
});