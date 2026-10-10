import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useTheme } from '../theme';

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
};

export default function SearchBar({ value, onChangeText, placeholder = 'Search tools' }: Props) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: theme.surface,
          borderColor: focused ? theme.text : theme.border,
        },
      ]}
    >
      <Ionicons name="search" size={20} color={focused ? theme.text : theme.textMuted} />

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        returnKeyType="search"
        autoCorrect={false}
        autoCapitalize="none"
        selectionColor={theme.text}
        style={[styles.input, { color: theme.text }]}
      />

      {value.length > 0 && (
        <Pressable
          onPress={() => onChangeText('')}
          hitSlop={12}
          style={[styles.clear, { backgroundColor: theme.textMuted }]}
        >
          <Ionicons name="close" size={14} color={theme.bg} />
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 54,
    paddingHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  input: { flex: 1, fontSize: 16, paddingVertical: 0 },
  clear: { width: 22, height: 22, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
});