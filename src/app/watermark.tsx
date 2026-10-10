import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
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
import WatermarkLayer, { WatermarkConfig, hasWatermark } from '../components/WatermarkLayer';
import { PickedImage, pickImage, saveToGallery, shareImage } from '../services/imageActions';
import { getFileSize } from '../services/imageCompressor';
import { useTheme } from '../theme';
import { formatBytes, getImageFormat } from '../utils/format';

const MAX_SIDE = 3000; // longest side of the exported image (keeps memory use safe)
const MAX_PREVIEW_H = 360;

const DEFAULT: WatermarkConfig = {
  kind: 'text',
  text: '© Your Name',
  color: '#FFFFFF',
  logoUri: null,
  logoAspect: 1,
  sizePct: 6,
  opacity: 0.7,
  rotation: 0,
  px: 1,
  py: 1,
  tile: false,
};

type Result = { uri: string; width: number; height: number; size: number };

const imageSize = (uri: string) =>
  new Promise<{ width: number; height: number }>((resolve, reject) =>
    Image.getSize(uri, (width, height) => resolve({ width, height }), reject)
  );

export default function Watermark() {
  const { theme } = useTheme();
  const router = useRouter();
  const { width: screenW } = useWindowDimensions();

  const [original, setOriginal] = useState<PickedImage | null>(null);
  const [config, setConfig] = useState<WatermarkConfig>(DEFAULT);
  const [result, setResult] = useState<Result | null>(null);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const [exporting, setExporting] = useState(false);
  const [exportLoaded, setExportLoaded] = useState(false);
  const [layerReady, setLayerReady] = useState(false);
  const exportRef = useRef<View>(null);

  const update = (patch: Partial<WatermarkConfig>) => setConfig((c) => ({ ...c, ...patch }));
  const isPng = original ? getImageFormat(original) === 'PNG' : false;

  /* ---------- picking ---------- */
  const onPick = async () => {
    const img = await pickImage();
    if (!img) return;
    setOriginal(img);
    setResult(null);
  };

  const onPickLogo = async () => {
    const img = await pickImage();
    if (!img) return;
    update({ logoUri: img.uri, logoAspect: img.width / img.height });
  };

  const onChangeKind = (kind: 'text' | 'logo') => update({ kind, sizePct: kind === 'text' ? 6 : 25 });

  const onToggleTile = (tile: boolean) =>
    update({ tile, rotation: tile && config.rotation === 0 ? -30 : config.rotation });

  /* ---------- export ---------- */
  const scale = original ? Math.min(1, MAX_SIDE / Math.max(original.width, original.height)) : 1;
  const outW = original ? Math.round(original.width * scale) : 0;
  const outH = original ? Math.round(original.height * scale) : 0;
  const ratio = PixelRatio.get();
  const expW = outW / ratio; // layout size chosen so the capture has exactly outW × outH pixels
  const expH = outH / ratio;

  const onApply = () => {
    if (!original || !hasWatermark(config)) return;
    setExportLoaded(false);
    setLayerReady(false);
    setExporting(true);
  };

  useEffect(() => {
    if (!exporting || !exportLoaded || !layerReady) return;
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
        console.warn('Watermark export failed', e);
        if (!cancelled) {
          Alert.alert('Failed', `Could not add the watermark.\n\n${e?.message ?? String(e)}`);
        }
      } finally {
        if (!cancelled) setExporting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [exporting, exportLoaded, layerReady]);

  /* ---------- preview size ---------- */
  const previewMaxW = screenW - 40;
  let pw = 0;
  let ph = 0;
  if (original) {
    const s = Math.min(previewMaxW / original.width, MAX_PREVIEW_H / original.height);
    pw = original.width * s;
    ph = original.height * s;
  }

  const sizeRange = config.kind === 'text' ? { min: 2, max: 20 } : { min: 8, max: 60 };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <AppHeader title="Watermark" onBack={() => router.back()} />

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
              <OutlineButton icon="water-outline" label="Edit again" onPress={() => setResult(null)} />
              <OutlineButton icon="images-outline" label="New image" onPress={onPick} />
            </View>
          </>
        ) : (
          /* ---------- Editor ---------- */
          <>
            {/* Live preview: drag the watermark to move it */}
            <View style={[styles.box, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={{ width: pw, height: ph, overflow: 'hidden' }}>
                <Image source={{ uri: original.uri }} style={{ width: pw, height: ph }} resizeMode="stretch" />
                <WatermarkLayer
                  width={pw}
                  height={ph}
                  config={config}
                  draggable={!config.tile}
                  showHandles={!config.tile}
                  onMove={(px, py) => update({ px, py })}
                  onDragState={(active) => setScrollEnabled(!active)}
                />
              </View>
            </View>

            <View style={styles.metaRow}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, flex: 1 }}>
                <Ionicons name="move-outline" size={15} color={theme.textMuted} />
                <Text style={{ color: theme.textMuted, fontSize: 13, flex: 1 }}>
                  {config.tile ? 'Turn off Tile to drag the watermark' : 'Drag the watermark to move it'}
                </Text>
              </View>
              <Pressable onPress={onPick} hitSlop={8}>
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>Change</Text>
              </Pressable>
            </View>

            {/* Settings */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Segmented<'text' | 'logo'>
                value={config.kind}
                onChange={onChangeKind}
                options={[
                  { label: 'Text', value: 'text' },
                  { label: 'Logo', value: 'logo' },
                ]}
              />

              {config.kind === 'text' ? (
                <View style={{ marginTop: 18 }}>
                  <Text style={[styles.label, { color: theme.text }]}>Text</Text>
                  <TextInput
                    value={config.text}
                    onChangeText={(t) => update({ text: t })}
                    placeholder="Your watermark"
                    placeholderTextColor={theme.textMuted}
                    style={[styles.input, { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text }]}
                  />

                  <Text style={[styles.label, { color: theme.text, marginTop: 18 }]}>Color</Text>
                  <ColorPicker value={config.color} onChange={(color) => update({ color })} />
                </View>
              ) : (
                <View style={{ marginTop: 18 }}>
                  <Pressable
                    onPress={onPickLogo}
                    style={[styles.logoPicker, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
                  >
                    {config.logoUri ? (
                      <Image source={{ uri: config.logoUri }} style={styles.logoThumb} resizeMode="contain" />
                    ) : (
                      <Ionicons name="image-outline" size={26} color={theme.text} />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: theme.text, fontWeight: '700', fontSize: 15 }}>
                        {config.logoUri ? 'Change logo' : 'Choose logo'}
                      </Text>
                      <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>
                        A PNG with a transparent background looks best.
                      </Text>
                    </View>
                  </Pressable>
                </View>
              )}

              <LabeledSlider
                label="Size"
                valueText={`${config.sizePct}%`}
                min={sizeRange.min}
                max={sizeRange.max}
                step={1}
                value={config.sizePct}
                onChange={(v) => update({ sizePct: v })}
              />
              <LabeledSlider
                label="Opacity"
                valueText={`${Math.round(config.opacity * 100)}%`}
                min={0.1}
                max={1}
                step={0.05}
                value={config.opacity}
                onChange={(v) => update({ opacity: v })}
              />
              <LabeledSlider
                label="Rotation"
                valueText={`${config.rotation}°`}
                min={-90}
                max={90}
                step={5}
                value={config.rotation}
                onChange={(v) => update({ rotation: v })}
              />

              {/* Position presets + tile */}
              <View style={styles.positionRow}>
                <View>
                  <Text style={[styles.label, { color: theme.text, marginBottom: 10 }]}>Quick position</Text>
                  <PositionGrid
                    px={config.px}
                    py={config.py}
                    onChange={(px, py) => update({ px, py })}
                    disabled={config.tile}
                  />
                </View>
                <View style={{ flex: 1, paddingLeft: 20 }}>
                  <View style={styles.rowBetween}>
                    <Text style={[styles.label, { color: theme.text }]}>Tile</Text>
                    <Switch
                      value={config.tile}
                      onValueChange={onToggleTile}
                      trackColor={{ false: theme.border, true: theme.text }}
                      thumbColor={theme.bg}
                    />
                  </View>
                  <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 6 }}>
                    Repeat the watermark across the whole image.
                  </Text>
                </View>
              </View>
            </View>

            <GradientButton
              label="Add Watermark"
              onPress={onApply}
              loading={exporting}
              disabled={!hasWatermark(config)}
            />
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
            <WatermarkLayer width={expW} height={expH} config={config} onReady={() => setLayerReady(true)} />
          </View>
        </View>
      )}
    </View>
  );
}

/* ---------- small local components ---------- */

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

function PositionGrid({
  px, py, onChange, disabled,
}: { px: number; py: number; onChange: (px: number, py: number) => void; disabled?: boolean }) {
  const { theme } = useTheme();
  const steps = [0, 0.5, 1];
  return (
    <View
      style={{
        width: 138, padding: 3, borderRadius: 16, borderWidth: 1,
        backgroundColor: theme.surfaceAlt, borderColor: theme.border, opacity: disabled ? 0.4 : 1,
      }}
    >
      {steps.map((y) => (
        <View key={y} style={{ flexDirection: 'row' }}>
          {steps.map((x) => {
            const active = Math.abs(px - x) < 0.01 && Math.abs(py - y) < 0.01;
            return (
              <Pressable
                key={x}
                disabled={disabled}
                onPress={() => onChange(x, y)}
                style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}
              >
                <View
                  style={{
                    width: active ? 16 : 9, height: active ? 16 : 9, borderRadius: 8,
                    backgroundColor: active ? theme.text : theme.border,
                  }}
                />
              </Pressable>
            );
          })}
        </View>
      ))}
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
  input: { height: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontSize: 16, marginTop: 10 },
  logoPicker: { flexDirection: 'row', alignItems: 'center', gap: 14, borderWidth: 1, borderRadius: 18, padding: 14 },
  logoThumb: { width: 48, height: 48 },
  positionRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 22 },
  statsRow: { flexDirection: 'row', gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
});