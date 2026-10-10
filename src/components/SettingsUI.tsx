import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';

export function SettingsSection({ title, children }: { title: string; children: React.ReactNode }) {
  const { theme } = useTheme();
  const rows = React.Children.toArray(children).filter(Boolean);
  return (
    <View>
      <Text style={[styles.sectionTitle, { color: theme.textMuted }]}>{title.toUpperCase()}</Text>
      <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {rows.map((child, i) =>
          React.isValidElement(child) ? React.cloneElement(child as React.ReactElement<any>, { divider: i > 0 }) : child
        )}
      </View>
    </View>
  );
}

type RowProps = {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  title: string;
  subtitle?: string;
  value?: string;
  onPress?: () => void;
  right?: React.ReactNode;
  divider?: boolean; // set automatically by SettingsSection
};

export function SettingsRow({ icon, title, subtitle, value, onPress, right, divider }: RowProps) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({ pressed }) => [
        styles.row,
        { borderTopColor: theme.border, borderTopWidth: divider ? StyleSheet.hairlineWidth : 0, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <View style={[styles.iconTile, { backgroundColor: theme.surfaceAlt }]}>
        <Ionicons name={icon} size={20} color={theme.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: theme.text, fontSize: 15, fontWeight: '600' }}>{title}</Text>
        {subtitle ? <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>{subtitle}</Text> : null}
      </View>
      {value ? <Text style={{ color: theme.textMuted, fontSize: 14 }}>{value}</Text> : null}
      {right}
      {onPress && !right ? <Ionicons name="chevron-forward" size={18} color={theme.textMuted} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  sectionTitle: { fontSize: 12, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8, marginLeft: 6 },
  card: { borderRadius: 20, borderWidth: 1, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14, paddingHorizontal: 16 },
  iconTile: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});