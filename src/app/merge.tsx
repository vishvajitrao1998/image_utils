import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Image, Pressable, ScrollView,
    StyleSheet,
    Switch,
    Text,
    useWindowDimensions,
    View,
} from 'react-native';

import AppHeader from '../components/AppHeader';
import Chip from '../components/Chip';
import ColorPicker from '../components/ColorPicker';
import GradientButton from '../components/GradientButton';
import ImageDropzone from '../components/ImageDropzone';
import OutlineButton from '../components/OutlineButton';
import Segmented from '../components/Segmented';
import Stat from '../components/Stat';
import { pickImages, saveToGallery, shareImage } from '../services/imageActions';
import { exportMerge, MergeResult, prepareImage } from '../services/imageMerger';
import { useTheme } from '../theme';
import { formatBytes, getImageFormat } from '../utils/format';
import { computeLayout, MergeMode, MergeSettings } from '../utils/mergeLayout';

const MAX_IMAGES = 20;
const MAX_OUTPUT_SIDE = 4096;
const MAX_PREVIEW_H = 400;

type Item = { id: string; uri: string; width: number; height: number };
type CellKey = 'auto' | '1:1' | '4:3' | '3:4' | '16:9';

const CELLS: { key: CellKey; label: string; value: number | null }[] = [
  { key: 'auto', label: 'Auto', value: null },
  { key: '1:1', label: '1:1', value: 1 },
  { key: '4:3', label: '4:3', value: 4 / 3 },
  { key: '3:4', label: '3:4', value: 3 / 4 },
  { key: '16:9', label: '16:9', value: 16 / 9 },
];

export default function Merge() {
  const { theme } = useTheme();
  const router = useRouter();
  const { width: screenW } = useWindowDimensions();

  const [items, setItems] = useState<Item[]>([]);
  const [preparing, setPreparing] = useState<{ done: number; total: number } | null>(null);
  const idCounter = useState({ n: 0 })[0];

  const [mode, setMode] = useState<MergeMode>('vertical');
  const [columns, setColumns] = useState(2);
  const [cellKey, setCellKey] = useState<CellKey>('1:1');
  const [fit, setFit] = useState<'fill' | 'fit'>('fill');
  const [spacing, setSpacing] = useState(2);
  const [padding, setPadding] = useState(2);
  const [radius, setRadius] = useState(0);
  const [bgColor, setBgColor] = useState('#FFFFFF');
  const [transparent, setTransparent] = useState(false);
  const [format, setFormat] = useState<'jpeg' | 'png'>('jpeg');

  const [result, setResult] = useState<MergeResult | null>(null);
  const [busy, setBusy] = useState(false);

  const outFormat = transparent ? 'png' : format;

  /* ---------- adding images ---------- */
  const onAdd = async () => {
    const remaining = MAX_IMAGES - items.length;
    if (remaining <= 0) {
      Alert.alert('Limit reached', `You can merge up to ${MAX_IMAGES} images.`);
      return;
    }
    const picked = await pickImages(remaining);
    if (!picked.length) return;

    const added: Item[] = [];
    try {
      setPreparing({ done: 0, total: picked.length });
      for (let i = 0; i < picked.length; i++) {
        const p = picked[i];
        const prepared = await prepareImage(p, getImageFormat(p) === 'PNG');
        idCounter.n += 1;
        added.push({ id: `i${idCounter.n}`, ...prepared });
        setPreparing({ done: i + 1, total: picked.length });
      }
    } catch {
      Alert.alert('Could not open an image', 'One of the selected images could not be read.');
    } finally {
      setPreparing(null);
    }
    if (added.length) {
      setItems((prev) => [...prev, ...added]);
      setResult(null);
    }
  };

  const move = (index: number, dir: -1 | 1) =>
    setItems((prev) => {
      const next = [...prev];
      const j = index + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[index], next[j]] = [next[j], next[index]];
      return next;
    });

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  const onStartOver = () => {
    setItems([]);
    setResult(null);
  };

  /* ---------- layout ---------- */
  const settings: MergeSettings = {
    mode,
    columns,
    cellAspect: CELLS.find((c) => c.key === cellKey)!.value,
    fit,
    spacing,
    padding,
  };

  const layout = useMemo(
    () => computeLayout(items.map((i) => ({ width: i.width, height: i.height })), settings),
    [items, mode, columns, cellKey, fit, spacing, padding]
  );

  const previewMaxW = screenW - 40 - 32;
  const pScale = Math.min(previewMaxW / layout.width, MAX_PREVIEW_H / layout.height);
  const pw = layout.width * pScale;
  const ph = layout.height * pScale;

  /* ---------- export ---------- */
  const onMerge = async () => {
    if (items.length < 2) return;
    try {
      setBusy(true);
      const out = await exportMerge({
        uris: items.map((i) => i.uri),
        layout,
        bgColor: transparent ? null : bgColor,
        radiusPct: radius,
        format: outFormat,
        maxSide: MAX_OUTPUT_SIDE,
      });
      setResult(out);
    } catch (e: any) {
      console.warn('Merge failed', e);
      Alert.alert('Merge failed', e?.message ?? 'Something went wrong while merging.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <AppHeader title="Merge" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {preparing ? (
          <View style={[styles.box, { backgroundColor: theme.surface, borderColor: theme.border, height: 200 }]}>
            <ActivityIndicator color={theme.text} />
            <Text style={{ color: theme.textMuted, marginTop: 10 }}>
              Preparing {preparing.done} of {preparing.total}…
            </Text>
          </View>
        ) : items.length === 0 ? (
          <ImageDropzone onPress={onAdd} title="Choose images" subtitle="Pick two or more to merge into one" />
        ) : result ? (
          /* ---------- Result ---------- */
          <>
            <View style={[styles.box, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Image
                source={{ uri: result.uri }}
                style={{ width: '100%', aspectRatio: result.width / result.height, maxHeight: 420 }}
                resizeMode="contain"
              />
            </View>

            <View style={styles.statsRow}>
              <Stat label="Images" value={`${items.length}`} />
              <Stat label="Size" value={`${result.width}×${result.height}`} />
              <Stat label="File size" value={formatBytes(result.size)} />
            </View>

            <View style={styles.row}>
              <OutlineButton icon="download-outline" label="Save" onPress={() => saveToGallery(result.uri)} />
              <OutlineButton icon="share-outline" label="Share" onPress={() => shareImage(result.uri)} />
            </View>
            <View style={styles.row}>
              <OutlineButton icon="albums-outline" label="Edit again" onPress={() => setResult(null)} />
              <OutlineButton icon="refresh-outline" label="Start over" onPress={onStartOver} />
            </View>
          </>
        ) : (
          /* ---------- Editor ---------- */
          <>
            {/* Live preview */}
            <View
              style={[
                styles.box,
                { backgroundColor: theme.surface, borderColor: theme.border, padding: 16 },
              ]}
            >
              <View
                style={{
                  width: pw,
                  height: ph,
                  overflow: 'hidden',
                  backgroundColor: transparent ? theme.surfaceAlt : bgColor,
                }}
              >
                {items.map((it, i) => {
                  const r = layout.rects[i];
                  if (!r) return null;
                  return (
                    <Image
                      key={it.id}
                      source={{ uri: it.uri }}
                      resizeMode="cover"
                      style={{
                        position: 'absolute',
                        left: r.x * pScale,
                        top: r.y * pScale,
                        width: r.w * pScale,
                        height: r.h * pScale,
                        borderRadius: (Math.min(r.w, r.h) * pScale * radius) / 100,
                      }}
                    />
                  );
                })}
              </View>
            </View>

            <View style={styles.metaRow}>
              <Text style={{ color: theme.textMuted, fontSize: 13, flex: 1 }}>
                {items.length} image{items.length > 1 ? 's' : ''} · {Math.round(layout.width)} × {Math.round(layout.height)} px
                {items.length < 2 ? ' · add at least 2 images' : ''}
              </Text>
              <Pressable onPress={onStartOver} hitSlop={8}>
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>Clear all</Text>
              </Pressable>
            </View>

            {/* Image list */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.rowBetween}>
                <Text style={[styles.label, { color: theme.text }]}>
                  Images ({items.length}/{MAX_IMAGES})
                </Text>
                <Pressable onPress={onAdd} hitSlop={8} style={styles.addBtn}>
                  <Ionicons name="add-circle-outline" size={20} color={theme.text} />
                  <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>Add</Text>
                </Pressable>
              </View>

              {items.map((it, i) => (
                <View key={it.id} style={[styles.itemRow, { borderColor: theme.border }]}>
                  <Image source={{ uri: it.uri }} style={styles.thumb} resizeMode="cover" />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>Image {i + 1}</Text>
                    <Text style={{ color: theme.textMuted, fontSize: 12 }}>
                      {it.width} × {it.height}
                    </Text>
                  </View>
                  <SmallBtn icon="chevron-up" disabled={i === 0} onPress={() => move(i, -1)} />
                  <SmallBtn icon="chevron-down" disabled={i === items.length - 1} onPress={() => move(i, 1)} />
                  <SmallBtn icon="close" onPress={() => remove(it.id)} />
                </View>
              ))}
            </View>

            {/* Settings */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Segmented<MergeMode>
                value={mode}
                onChange={setMode}
                options={[
                  { label: 'Vertical', value: 'vertical' },
                  { label: 'Horizontal', value: 'horizontal' },
                  { label: 'Grid', value: 'grid' },
                ]}
              />

              {mode === 'grid' && (
                <View style={{ marginTop: 18 }}>
                  <Text style={[styles.label, { color: theme.text }]}>Columns</Text>
                  <View style={styles.chips}>
                    {[2, 3, 4].map((c) => (
                      <Chip key={c} label={`${c}`} selected={columns === c} onPress={() => setColumns(c)} />
                    ))}
                  </View>

                  <Text style={[styles.label, { color: theme.text, marginTop: 18 }]}>Cell shape</Text>
                  <View style={styles.chips}>
                    {CELLS.map((c) => (
                      <Chip key={c.key} label={c.label} selected={cellKey === c.key} onPress={() => setCellKey(c.key)} />
                    ))}
                  </View>

                  <Text style={[styles.label, { color: theme.text, marginTop: 18 }]}>Image fit</Text>
                  <View style={{ marginTop: 10 }}>
                    <Segmented<'fill' | 'fit'>
                      value={fit}
                      onChange={setFit}
                      options={[
                        { label: 'Fill (crop)', value: 'fill' },
                        { label: 'Fit (whole image)', value: 'fit' },
                      ]}
                    />
                  </View>
                </View>
              )}

              <LabeledSlider label="Spacing" valueText={`${spacing}%`} min={0} max={10} step={0.5} value={spacing} onChange={setSpacing} />
              <LabeledSlider label="Outer padding" valueText={`${padding}%`} min={0} max={10} step={0.5} value={padding} onChange={setPadding} />
              <LabeledSlider label="Rounded corners" valueText={`${radius}%`} min={0} max={30} step={1} value={radius} onChange={setRadius} />

              <View style={[styles.switchRow, { borderTopColor: theme.border }]}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={[styles.label, { color: theme.text }]}>Transparent background</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>Saved as PNG</Text>
                </View>
                <Switch
                  value={transparent}
                  onValueChange={setTransparent}
                  trackColor={{ false: theme.border, true: theme.text }}
                  thumbColor={theme.bg}
                />
              </View>

              {!transparent && (
                <View style={{ marginTop: 6 }}>
                  <Text style={[styles.label, { color: theme.text }]}>Background color</Text>
                  <ColorPicker value={bgColor} onChange={setBgColor} />
                </View>
              )}

              <Text style={[styles.label, { color: theme.text, marginTop: 20 }]}>Save as</Text>
              <View style={styles.chips}>
                <Chip label="JPG" selected={outFormat === 'jpeg'} onPress={() => !transparent && setFormat('jpeg')} />
                <Chip label="PNG" selected={outFormat === 'png'} onPress={() => setFormat('png')} />
              </View>
            </View>

            <GradientButton label="Merge images" onPress={onMerge} loading={busy} disabled={items.length < 2} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

/* ---------- small local components ---------- */

function SmallBtn({
  icon, onPress, disabled,
}: { icon: React.ComponentProps<typeof Ionicons>['name']; onPress: () => void; disabled?: boolean }) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      style={[styles.smallBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, opacity: disabled ? 0.35 : 1 }]}
    >
      <Ionicons name={icon} size={18} color={theme.text} />
    </Pressable>
  );
}

function LabeledSlider({
  label, valueText, min, max, step, value, onChange,
}: {
  label: string; valueText: string; min: number; max: number; step: number; value: number;
  onChange: (v: number) => void;
}) {
  const { theme } = useTheme();
  return (
    <View style={{ marginTop: 18 }}>
      <View style={styles.rowBetween}>
        <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
        <Text style={[styles.label, { color: theme.text }]}>{valueText}</Text>
      </View>
      <Slider
        style={{ height: 40, marginHorizontal: -4 }}
        minimumValue={min}
        maximumValue={max}
        step={step}
        value={value}
        onValueChange={onChange}
        minimumTrackTintColor={theme.text}
        maximumTrackTintColor={theme.border}
        thumbTintColor={theme.text}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingBottom: 48, gap: 16 },
  box: { borderRadius: 24, borderWidth: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingHorizontal: 4 },
  card: { borderRadius: 24, borderWidth: 1, padding: 20 },
  label: { fontSize: 15, fontWeight: '700' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  itemRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, borderTopWidth: StyleSheet.hairlineWidth, marginTop: 10,
  },
  thumb: { width: 52, height: 52, borderRadius: 12 },
  smallBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTopWidth: 1 },
  statsRow: { flexDirection: 'row', gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
});