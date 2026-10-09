import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

type Props<T extends string> = {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
};

export default function Segmented<T extends string>({ options, value, onChange }: Props<T>) {
  const { theme } = useTheme();
  return (
    <View style={[styles.wrap, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <Pressable
            key={o.value}
            onPress={() => onChange(o.value)}
            style={[styles.item, active && { backgroundColor: theme.text }]}
          >
            <Text style={{ color: active ? theme.bg : theme.textMuted, fontWeight: '700', fontSize: 14 }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', borderRadius: 14, borderWidth: 1, padding: 4 },
  item: { flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10 },
});