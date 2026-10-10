import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useFonts } from 'expo-font';
import { useRouter } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
    Alert,
    Image,
    PixelRatio,
    Pressable, ScrollView,
    StyleSheet,
    Switch,
    Text,
    TextInput,
    View,
    useWindowDimensions,
} from 'react-native';
import { captureRef } from 'react-native-view-shot';

import AppHeader from '../components/AppHeader';
import ColorPicker from '../components/ColorPicker';
import GradientButton from '../components/GradientButton';
import ImageDropzone from '../components/ImageDropzone';
import OutlineButton from '../components/OutlineButton';
import Segmented from '../components/Segmented';
import Stat from '../components/Stat';
import TextOverlay, { TextLayer, isVisible } from '../components/TextOverlay';
import { FONTS, FONT_ASSETS, canBold, canItalic, resolveFont } from '../constants/fonts';
import { PickedImage, pickImage, saveToGallery, shareImage } from '../services/imageActions';
import { getFileSize } from '../services/imageCompressor';
import { useTheme } from '../theme';
import { formatBytes, getImageFormat } from '../utils/format';

const MAX_SIDE = 3000; // longest side of the exported image
const MAX_PREVIEW_H = 360;

type Tab = 'text' | 'style' | 'color' | 'shadow';
type Result = { uri: string; width: number; height: number; size: number };

const newLayer = (id: string, n: number): TextLayer => ({
  id,
  text: n === 1 ? 'Your text' : 'New text',
  fontKey: 'sans',
  bold: true,
  italic: false,
  underline: false,
  strike: false,
  align: 'center',
  color: '#FFFFFF',
  sizePct: 10,
  opacity: 1,
  rotation: 0,
  bgOn: false,
  bgColor: '#000000',
  bgOpacity: 0.5,
  shadowOn: true,
  shadowColor: '#000000',
  shadowBlur: 6,
  shadowX: 2,
  shadowY: 2,
  px: 0.5,
  py: Math.min(0.9, 0.4 + ((n - 1) % 5) * 0.12),
});

const imageSize = (uri: string) =>
  new Promise<{ width: number; height: number }>((resolve, reject) =>
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject)
  );

export default function AddText() {
  const { theme } = useTheme();
  const router = useRouter();
  const { width: screenW } = useWindowDimensions();
  const [fontsLoaded] = useFonts(FONT_ASSETS);

  const [original, setOriginal] = useState<PickedImage | null>(null);
  const [layers, setLayers] = useState<TextLayer[]>(() => [newLayer('t1', 1)]);
  const [selectedId, setSelectedId] = useState<string | null>('t1');
  const [tab, setTab] = useState<Tab>('text');
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [result, setResult] = useState<Result | null>(null);

  const [exporting, setExporting] = useState(false);
  const [exportLoaded, setExportLoaded] = useState(false);
  const [layersReady, setLayersReady] = useState(false);
  const exportRef = useRef<View>(null);
  const counter = useRef(1);

  const selected = layers.find((l) => l.id === selectedId) ?? null;
  const fontList = fontsLoaded ? FONTS : FONTS.filter((f) => f.system);
  const isPng = original ? getImageFormat(original) === 'PNG' : false;

  const update = (patch: Partial<TextLayer>) =>
    setLayers((ls) => ls.map((l) => (l.id === selectedId ? { ...l, ...patch } : l)));

  const moveLayer = (id: string, px: number, py: number) =>
    setLayers((ls) => ls.map((l) => (l.id === id ? { ...l, px, py } : l)));

  const addLayer = () => {
    counter.current += 1;
    const layer = newLayer(`t${counter.current}`, counter.current);
    setLayers((ls) => [...ls, layer]);
    setSelectedId(layer.id);
    setTab('text');
  };

  const deleteLayer = () => {
    if (!selectedId) return;
    const rest = layers.filter((l) => l.id !== selectedId);
    setLayers(rest);
    setSelectedId(rest.length ? rest[rest.length - 1].id : null);
  };

  const onPick = async () => {
    const img = await pickImage();
    if (!img) return;
    setOriginal(img);
    setResult(null);
  };

  /* ---------- export ---------- */
  const scale = original ? Math.min(1, MAX_SIDE / Math.max(original.width, original.height)) : 1;
  const outW = original ? Math.round(original.width * scale) : 0;
  const outH = original ? Math.round(original.height * scale) : 0;
  const ratio = PixelRatio.get();
  const expW = outW / ratio; // layout size chosen so the capture has exactly outW × outH pixels
  const expH = outH / ratio;
  const hasContent = layers.some(isVisible);

  const onApply = () => {
    if (!original || !hasContent) return;
    setExportLoaded(false);
    setLayersReady(false);
    setSelectedId(selectedId); // no-op, keeps selection
    setExporting(true);
  };

  useEffect(() => {
    if (!exporting || !exportLoaded || !layersReady) return;
    let cancelled = false;
    (async () => {
      try {
        await new Promise((r) => setTimeout(r, 300)); // let the hidden view finish drawing
        const raw = await captureRef(exportRef, {
          format: isPng ? 'png' : 'jpg',
          quality: 0.95,
          result: 'tmpfile',
        });
        const uri = raw.startsWith('file://') || raw.startsWith('data:') ? raw : `file://${raw}`;
        const [dims, size] = await Promise.all([imageSize(uri), getFileSize(uri)]);
        if (!cancelled) setResult({ uri, width: dims.width, height: dims.height, size });
      } catch (e: any) {
        console.warn('Add text export failed', e);
        if (!cancelled) Alert.alert('Failed', `Could not add the text.\n\n${e?.message ?? String(e)}`);
      } finally {
        if (!cancelled) setExporting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [exporting, exportLoaded, layersReady]);

  /* ---------- preview size ---------- */
  let pw = 0;
  let ph = 0;
  if (original) {
    const s = Math.min((screenW - 40) / original.width, MAX_PREVIEW_H / original.height);
    pw = original.width * s;
    ph = original.height * s;
  }

  const fontDef = selected ? FONTS.find((f) => f.key === selected.fontKey) ?? FONTS[0] : FONTS[0];

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <AppHeader title="Add Text" onBack={() => router.back()} />

      <ScrollView
        scrollEnabled={scrollEnabled}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {!original ? (
          <ImageDropzone onPress={onPick} />
        ) : result ? (
          /* ---------- Result ---------- */
          <>
            <View style={[styles.box, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Image
                source={{ uri: result.uri }}
                style={{ width: '100%', aspectRatio: result.width / result.height, maxHeight: 360 }}
                resizeMode="contain"
              />
            </View>

            <View style={styles.statsRow}>
              <Stat label="Original" value={`${original.width}×${original.height}`} />
              <Stat label="New" value={`${result.width}×${result.height}`} />
              <Stat label="File size" value={formatBytes(result.size)} />
            </View>

            <View style={styles.row}>
              <OutlineButton icon="download-outline" label="Save" onPress={() => saveToGallery(result.uri)} />
              <OutlineButton icon="share-outline" label="Share" onPress={() => shareImage(result.uri)} />
            </View>
            <View style={styles.row}>
              <OutlineButton icon="text-outline" label="Edit again" onPress={() => setResult(null)} />
              <OutlineButton icon="images-outline" label="New image" onPress={onPick} />
            </View>
          </>
        ) : (
          /* ---------- Editor ---------- */
          <>
            {/* Live preview: drag any text to move it */}
            <View style={[styles.box, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={{ width: pw, height: ph, overflow: 'hidden' }}>
                <Image source={{ uri: original.uri }} style={{ width: pw, height: ph }} resizeMode="stretch" />
                <TextOverlay
                  width={pw}
                  height={ph}
                  layers={layers}
                  selectedId={selectedId}
                  interactive
                  onSelect={setSelectedId}
                  onMove={moveLayer}
                  onDragState={(active) => setScrollEnabled(!active)}
                />
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <Ionicons name="move-outline" size={15} color={theme.textMuted} />
                <Text style={{ color: theme.textMuted, fontSize: 13, flex: 1 }}>
                  Drag text to move it. Tap text to select it.
                </Text>
              </View>
              <Pressable onPress={onPick} hitSlop={8}>
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>Change</Text>
              </Pressable>
            </View>

            {/* Layers */}
            <View style={styles.layerRow}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10 }} style={{ flex: 1 }}>
                {layers.map((l, i) => {
                  const active = l.id === selectedId;
                  return (
                    <Pressable
                      key={l.id}
                      onPress={() => setSelectedId(l.id)}
                      style={[
                        styles.layerChip,
                        {
                          backgroundColor: active ? theme.text : theme.surfaceAlt,
                          borderColor: active ? theme.text : theme.border,
                        },
                      ]}
                    >
                      <Text style={{ color: active ? theme.bg : theme.text, fontWeight: '600', fontSize: 14 }} numberOfLines={1}>
                        {i + 1}. {l.text.trim().slice(0, 10) || 'Empty'}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              <Pressable
                onPress={addLayer}
                style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
              >
                <Ionicons name="add" size={22} color={theme.text} />
              </Pressable>
              <Pressable
                onPress={deleteLayer}
                disabled={!selected}
                style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: theme.border, opacity: selected ? 1 : 0.4 }]}
              >
                <Ionicons name="trash-outline" size={20} color={theme.text} />
              </Pressable>
            </View>

            {/* Settings for the selected layer */}
            {selected ? (
              <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Segmented<Tab>
                  value={tab}
                  onChange={setTab}
                  options={[
                    { label: 'Text', value: 'text' },
                    { label: 'Style', value: 'style' },
                    { label: 'Color', value: 'color' },
                    { label: 'Shadow', value: 'shadow' },
                  ]}
                />

                {tab === 'text' && (
                  <View style={{ marginTop: 18 }}>
                    <Text style={[styles.label, { color: theme.text }]}>Text</Text>
                    <TextInput
                      value={selected.text}
                      onChangeText={(t) => update({ text: t })}
                      placeholder="Type something"
                      placeholderTextColor={theme.textMuted}
                      multiline
                      style={[
                        styles.input,
                        { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text },
                      ]}
                    />

                    <Text style={[styles.label, { color: theme.text, marginTop: 18 }]}>Font</Text>
                    <View style={styles.fontGrid}>
                      {fontList.map((f) => {
                        const active = f.key === selected.fontKey;
                        return (
                          <Pressable
                            key={f.key}
                            onPress={() =>
                              update({
                                fontKey: f.key,
                                bold: canBold(f) ? selected.bold : false,
                                italic: canItalic(f) ? selected.italic : false,
                              })
                            }
                            style={[
                              styles.fontCard,
                              {
                                backgroundColor: theme.surfaceAlt,
                                borderColor: active ? theme.text : theme.border,
                                borderWidth: active ? 2 : 1,
                              },
                            ]}
                          >
                            <Text style={[{ color: theme.text, fontSize: 18 }, resolveFont(f, false, false)]} numberOfLines={1}>
                              {f.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    {!fontsLoaded && (
                      <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 10 }}>Loading more fonts…</Text>
                    )}
                  </View>
                )}

                {tab === 'style' && (
                  <View style={{ marginTop: 18 }}>
                    <Text style={[styles.label, { color: theme.text }]}>Font style</Text>
                    <View style={styles.toggleRow}>
                      <ToggleBtn icon="format-bold" active={selected.bold} disabled={!canBold(fontDef)} onPress={() => update({ bold: !selected.bold })} />
                      <ToggleBtn icon="format-italic" active={selected.italic} disabled={!canItalic(fontDef)} onPress={() => update({ italic: !selected.italic })} />
                      <ToggleBtn icon="format-underlined" active={selected.underline} onPress={() => update({ underline: !selected.underline })} />
                      <ToggleBtn icon="format-strikethrough" active={selected.strike} onPress={() => update({ strike: !selected.strike })} />
                    </View>

                    <Text style={[styles.label, { color: theme.text, marginTop: 18 }]}>Alignment</Text>
                    <View style={styles.toggleRow}>
                      <ToggleBtn icon="format-align-left" active={selected.align === 'left'} onPress={() => update({ align: 'left' })} />
                      <ToggleBtn icon="format-align-center" active={selected.align === 'center'} onPress={() => update({ align: 'center' })} />
                      <ToggleBtn icon="format-align-right" active={selected.align === 'right'} onPress={() => update({ align: 'right' })} />
                    </View>

                    <LabeledSlider label="Size" valueText={`${selected.sizePct}%`} min={2} max={30} step={1} value={selected.sizePct} onChange={(v) => update({ sizePct: v })} />
                    <LabeledSlider label="Rotation" valueText={`${selected.rotation}°`} min={-180} max={180} step={5} value={selected.rotation} onChange={(v) => update({ rotation: v })} />
                    <LabeledSlider label="Opacity" valueText={`${Math.round(selected.opacity * 100)}%`} min={0.1} max={1} step={0.05} value={selected.opacity} onChange={(v) => update({ opacity: v })} />
                  </View>
                )}

                {tab === 'color' && (
                  <View style={{ marginTop: 18 }}>
                    <Text style={[styles.label, { color: theme.text }]}>Text color</Text>
                    <ColorPicker value={selected.color} onChange={(color) => update({ color })} />

                    <View style={[styles.switchRow, { borderTopColor: theme.border }]}>
                      <Text style={[styles.label, { color: theme.text, flex: 1 }]}>Background</Text>
                      <Switch
                        value={selected.bgOn}
                        onValueChange={(bgOn) => update({ bgOn })}
                        trackColor={{ false: theme.border, true: theme.text }}
                        thumbColor={theme.bg}
                      />
                    </View>

                    {selected.bgOn && (
                      <>
                        <ColorPicker value={selected.bgColor} onChange={(bgColor) => update({ bgColor })} />
                        <LabeledSlider
                          label="Background opacity"
                          valueText={`${Math.round(selected.bgOpacity * 100)}%`}
                          min={0.1}
                          max={1}
                          step={0.05}
                          value={selected.bgOpacity}
                          onChange={(v) => update({ bgOpacity: v })}
                        />
                      </>
                    )}
                  </View>
                )}

                {tab === 'shadow' && (
                  <View style={{ marginTop: 18 }}>
                    <View style={styles.switchRowNoBorder}>
                      <Text style={[styles.label, { color: theme.text, flex: 1 }]}>Text shadow</Text>
                      <Switch
                        value={selected.shadowOn}
                        onValueChange={(shadowOn) => update({ shadowOn })}
                        trackColor={{ false: theme.border, true: theme.text }}
                        thumbColor={theme.bg}
                      />
                    </View>

                    {selected.shadowOn && (
                      <>
                        <Text style={[styles.label, { color: theme.text, marginTop: 6 }]}>Shadow color</Text>
                        <ColorPicker value={selected.shadowColor} onChange={(shadowColor) => update({ shadowColor })} />
                        <LabeledSlider label="Blur" valueText={`${selected.shadowBlur}`} min={0} max={20} step={1} value={selected.shadowBlur} onChange={(v) => update({ shadowBlur: v })} />
                        <LabeledSlider label="Offset X" valueText={`${selected.shadowX}`} min={-12} max={12} step={1} value={selected.shadowX} onChange={(v) => update({ shadowX: v })} />
                        <LabeledSlider label="Offset Y" valueText={`${selected.shadowY}`} min={-12} max={12} step={1} value={selected.shadowY} onChange={(v) => update({ shadowY: v })} />
                      </>
                    )}
                  </View>
                )}
              </View>
            ) : (
              <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={{ color: theme.textMuted }}>No text yet. Tap + to add some.</Text>
              </View>
            )}

            <GradientButton label="Save text on image" onPress={onApply} loading={exporting} disabled={!hasContent} />
          </>
        )}
      </ScrollView>

      {/* Hidden full-resolution render that gets captured on export */}
      {exporting && original && (
        <View pointerEvents="none" style={{ position: 'absolute', top: 0, left: -(expW + 200) }}>
          <View ref={exportRef} collapsable={false} style={{ width: expW, height: expH }}>
            <Image
              source={{ uri: original.uri }}
              style={{ width: expW, height: expH }}
              resizeMode="stretch"
              onLoad={() => setExportLoaded(true)}
            />
            <TextOverlay width={expW} height={expH} layers={layers} onAllMeasured={() => setLayersReady(true)} />
          </View>
        </View>
      )}
    </View>
  );
}

/* ---------- small local components ---------- */

function ToggleBtn({
  icon, active, onPress, disabled,
}: { icon: React.ComponentProps<typeof MaterialIcons>['name']; active: boolean; onPress: () => void; disabled?: boolean }) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.toggleBtn,
        {
          backgroundColor: active ? theme.text : theme.surfaceAlt,
          borderColor: active ? theme.text : theme.border,
          opacity: disabled ? 0.35 : 1,
        },
      ]}
    >
      <MaterialIcons name={icon} size={22} color={active ? theme.bg : theme.text} />
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
  layerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  layerChip: { paddingVertical: 10, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, maxWidth: 160 },
  iconBtn: { width: 42, height: 42, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: 24, borderWidth: 1, padding: 20 },
  label: { fontSize: 15, fontWeight: '700' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  input: {
    minHeight: 52, maxHeight: 120, borderRadius: 14, borderWidth: 1, marginTop: 10,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, textAlignVertical: 'top',
  },
  fontGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  fontCard: { width: '48%', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 14 },
  toggleRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  toggleBtn: { width: 48, height: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, marginBottom: 6, paddingTop: 16, borderTopWidth: 1 },
  switchRowNoBorder: { flexDirection: 'row', alignItems: 'center' },
  statsRow: { flexDirection: 'row', gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
});