import { Pressable, StyleSheet, Text } from 'react-native';
import { useTheme } from '../theme';

type Props = { label: string; selected: boolean; onPress: () => void };

export default function Chip({ label, selected, onPress }: Props) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        {
          backgroundColor: selected ? theme.text : theme.surfaceAlt,
          borderColor: selected ? theme.text : theme.border,
        },
      ]}
    >
      <Text style={{ color: selected ? theme.bg : theme.text, fontWeight: '600', fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1 },
});