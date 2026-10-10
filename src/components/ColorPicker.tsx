import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useTheme } from '../theme';
import { hexToHsv, hsvToHex, isHex } from '../utils/color';

const PRESETS = ['#FFFFFF', '#111111', '#8B5CF6', '#FF6B5E', '#FACC15', '#22C55E', '#3B82F6'];
const HUE_COLORS = ['#FF0000', '#FFFF00', '#00FF00', '#00FFFF', '#0000FF', '#FF00FF', '#FF0000'] as const;

type Props = { value: string; onChange: (hex: string) => void };

export default function ColorPicker({ value, onChange }: Props) {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);
  const [hsv, setHsv] = useState(() => hexToHsv(value));
  const [hexText, setHexText] = useState(value.toUpperCase());

  // Keep the sliders and hex field in sync when the color changes from outside (e.g. a preset)
  useEffect(() => {
    if (hsvToHex(hsv.h, hsv.s, hsv.v) !== value.toUpperCase()) setHsv(hexToHsv(value));
    setHexText(value.toUpperCase());
  }, [value]);

  const updateHsv = (patch: Partial<typeof hsv>) => {
    const next = { ...hsv, ...patch };
    setHsv(next);
    onChange(hsvToHex(next.h, next.s, next.v));
  };

  const onHexChange = (t: string) => {
    setHexText(t);
    if (isHex(t)) onChange('#' + t.replace('#', '').toUpperCase());
  };

  const current = value.toUpperCase();

  return (
    <View>
      <View style={styles.swatches}>
        {PRESETS.map((c) => {
          const active = current === c;
          return (
            <Pressable
              key={c}
              onPress={() => onChange(c)}
              style={[styles.swatch, { borderColor: active ? theme.text : theme.border, borderWidth: active ? 3 : 1 }]}
            >
              <View style={{ flex: 1, borderRadius: 16, backgroundColor: c }} />
            </Pressable>
          );
        })}

        {/* Custom color toggle */}
        <Pressable
          onPress={() => setOpen((o) => !o)}
          style={[styles.swatch, { borderColor: open ? theme.text : theme.border, borderWidth: open ? 3 : 1 }]}
        >
          <LinearGradient
            colors={HUE_COLORS}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ flex: 1, borderRadius: 16, alignItems: 'center', justifyContent: 'center' }}
          >
            <Ionicons name={open ? 'chevron-up' : 'add'} size={16} color="#fff" />
          </LinearGradient>
        </Pressable>
      </View>

      {open && (
        <View style={[styles.panel, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
          <Text style={[styles.small, { color: theme.textMuted }]}>Hue</Text>
          <GradientSlider colors={HUE_COLORS} min={0} max={359} value={hsv.h} onChange={(h) => updateHsv({ h })} />

          <Text style={[styles.small, { color: theme.textMuted }]}>Shade</Text>
          <GradientSlider
            colors={[hsvToHex(hsv.h, 0, hsv.v), hsvToHex(hsv.h, 1, hsv.v)] as const}
            min={0}
            max={1}
            value={hsv.s}
            onChange={(s) => updateHsv({ s })}
          />

          <Text style={[styles.small, { color: theme.textMuted }]}>Brightness</Text>
          <GradientSlider
            colors={['#000000', hsvToHex(hsv.h, hsv.s, 1)] as const}
            min={0}
            max={1}
            value={hsv.v}
            onChange={(v) => updateHsv({ v })}
          />

          <View style={styles.hexRow}>
            <View style={[styles.preview, { backgroundColor: value, borderColor: theme.border }]} />
            <TextInput
              value={hexText}
              onChangeText={onHexChange}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={7}
              placeholder="#RRGGBB"
              placeholderTextColor={theme.textMuted}
              style={[styles.hexInput, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
            />
          </View>
        </View>
      )}
    </View>
  );
}

function GradientSlider({
  colors, min, max, value, onChange,
}: {
  colors: readonly [string, string, ...string[]];
  min: number;
  max: number;
  value: number;
  onChange: (v: number) => void;
}) {
  const { theme } = useTheme();
  return (
    <View style={{ height: 36, justifyContent: 'center', marginBottom: 6 }}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ position: 'absolute', left: 10, right: 10, height: 12, borderRadius: 6 }}
      />
      <Slider
        style={{ height: 36 }}
        minimumValue={min}
        maximumValue={max}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor="transparent"
        maximumTrackTintColor="transparent"
        thumbTintColor={theme.text}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 10 },
  swatch: { width: 38, height: 38, borderRadius: 19, padding: 3 },
  panel: { marginTop: 14, borderRadius: 18, borderWidth: 1, padding: 14 },
  small: { fontSize: 12, marginBottom: 2 },
  hexRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 8 },
  preview: { width: 44, height: 44, borderRadius: 12, borderWidth: 1 },
  hexInput: { flex: 1, height: 44, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, fontSize: 16, fontWeight: '600' },
});