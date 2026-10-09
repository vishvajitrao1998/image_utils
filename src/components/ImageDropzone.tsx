import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

export default function ImageDropzone({ onPress }: { onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <Pressable onPress={onPress} style={[styles.zone, { borderColor: theme.border, backgroundColor: theme.surface }]}>
      <View style={[styles.icon, { backgroundColor: theme.surfaceAlt }]}>
        <Ionicons name="cloud-upload-outline" size={30} color={theme.text} />
      </View>
      <Text style={{ color: theme.text, fontSize: 18, fontWeight: '700' }}>Choose an image</Text>
      <Text style={{ color: theme.textMuted, marginTop: 4 }}>Tap to pick from your gallery</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  zone: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 24, paddingVertical: 56, alignItems: 'center' },
  icon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
});