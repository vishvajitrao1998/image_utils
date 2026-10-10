import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';

import AppHeader from '../components/AppHeader';
import Chip from '../components/Chip';
import CropOverlay, { CROP_PAD, Rect } from '../components/CropOverlay';
import GradientButton from '../components/GradientButton';
import ImageDropzone from '../components/ImageDropzone';
import OutlineButton from '../components/OutlineButton';
import Stat from '../components/Stat';
import { PickedImage, pickImage, saveToGallery, shareImage } from '../services/imageActions';
import { cropImage, CropResult } from '../services/imageCropper';
import { useTheme } from '../theme';
import { formatBytes, getImageFormat } from '../utils/format';
import { clamp } from '../utils/math';

type RatioKey = 'free' | '1:1' | '4:3' | '3:4' | '16:9' | '9:16' | 'original';

const RATIOS: { key: RatioKey; label: string; value: number | null }[] = [
  { key: 'free', label: 'Free', value: null },
  { key: '1:1', label: '1:1', value: 1 },
  { key: '4:3', label: '4:3', value: 4 / 3 },
  { key: '3:4', label: '3:4', value: 3 / 4 },
  { key: '16:9', label: '16:9', value: 16 / 9 },
  { key: '9:16', label: '9:16', value: 9 / 16 },
  { key: 'original', label: 'Original', value: -1 }, // resolved from the image
];

const MAX_PREVIEW_H = 420;

function getDisplay(img: { width: number; height: number }, maxW: number) {
  const scale = Math.min(maxW / img.width, MAX_PREVIEW_H / img.height);
  return { scale, dw: Math.round(img.width * scale), dh: Math.round(img.height * scale) };
}

function initialRect(W: number, H: number): Rect {
  return { x: W * 0.05, y: H * 0.05, w: W * 0.9, h: H * 0.9 };
}

function fitRatio(r: number, W: number, H: number): Rect {
  let w = W * 0.9;
  let h = w / r;
  if (h > H * 0.9) {
    h = H * 0.9;
    w = h * r;
  }
  return { x: (W - w) / 2, y: (H - h) / 2, w, h };
}

export default function Crop() {
  const { theme } = useTheme();
  const router = useRouter();
  const { width: screenW } = useWindowDimensions();
  const maxW = screenW - 40 - CROP_PAD * 2;

  const [original, setOriginal] = useState<PickedImage | null>(null);
  const [rect, setRect] = useState<Rect>({ x: 0, y: 0, w: 0, h: 0 });
  const [ratioKey, setRatioKey] = useState<RatioKey>('free');
  const [result, setResult] = useState<CropResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const display = useMemo(() => (original ? getDisplay(original, maxW) : null), [original, maxW]);

  const ratioValue = useMemo(() => {
    const r = RATIOS.find((x) => x.key === ratioKey)!;
    if (r.key === 'original') return original ? original.width / original.height : null;
    return r.value;
  }, [ratioKey, original]);

  const onPick = async () => {
    const img = await pickImage();
    if (!img) return;
    const d = getDisplay(img, maxW);
    setOriginal(img);
    setResult(null);
    setRatioKey('free');
    setRect(initialRect(d.dw, d.dh));
  };

  const onSelectRatio = (key: RatioKey) => {
    if (!original || !display) return;
    setRatioKey(key);
    const r = RATIOS.find((x) => x.key === key)!;
    const value = key === 'original' ? original.width / original.height : r.value;
    if (value) setRect(fitRatio(value, display.dw, display.dh));
  };

  const onReset = () => {
    if (!display) return;
    setRatioKey('free');
    setRect(initialRect(display.dw, display.dh));
  };

  const onCrop = async () => {
    if (!original || !display) return;
    const { scale } = display;
    const originX = clamp(Math.round(rect.x / scale), 0, original.width - 1);
    const originY = clamp(Math.round(rect.y / scale), 0, original.height - 1);
    const width = clamp(Math.round(rect.w / scale), 1, original.width - originX);
    const height = clamp(Math.round(rect.h / scale), 1, original.height - originY);

    try {
      setBusy(true);
      const out = await cropImage({
        uri: original.uri,
        originX,
        originY,
        width,
        height,
        format: getImageFormat(original) === 'PNG' ? 'png' : 'jpeg',
      });
      setResult(out);
    } catch {
      Alert.alert('Crop failed', 'Something went wrong while cropping this image.');
    } finally {
      setBusy(false);
    }
  };

  const selW = display ? Math.round(rect.w / display.scale) : 0;
  const selH = display ? Math.round(rect.h / display.scale) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <AppHeader title="Crop" onBack={() => router.back()} />

      <ScrollView
        scrollEnabled={scrollEnabled}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
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
              <Stat label="Cropped" value={`${result.width}×${result.height}`} />
              <Stat label="File size" value={formatBytes(result.size)} />
            </View>

            <View style={styles.row}>
              <OutlineButton icon="download-outline" label="Save" onPress={() => saveToGallery(result.uri)} />
              <OutlineButton icon="share-outline" label="Share" onPress={() => shareImage(result.uri)} />
            </View>
            <View style={styles.row}>
              <OutlineButton icon="crop-outline" label="Crop Again" onPress={() => setResult(null)} />
              <OutlineButton icon="images-outline" label="New image" onPress={onPick} />
            </View>
          </>
        ) : (
          /* ---------- Crop editor ---------- */
          <>
            <View
              style={[
                styles.box,
                { backgroundColor: theme.surface, borderColor: theme.border, alignItems: 'center', justifyContent: 'center' },
              ]}
            >
              <View style={{ width: display!.dw + CROP_PAD * 2, height: display!.dh + CROP_PAD * 2 }}>
                <Image
                  source={{ uri: original.uri }}
                  style={{ position: 'absolute', left: CROP_PAD, top: CROP_PAD, width: display!.dw, height: display!.dh }}
                  resizeMode="stretch"
                />
                <View style={StyleSheet.absoluteFill}>
                  <CropOverlay
                    width={display!.dw}
                    height={display!.dh}
                    rect={rect}
                    ratio={ratioValue}
                    onChange={setRect}
                    onGesture={(active) => setScrollEnabled(!active)}
                  />
                </View>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Text style={{ color: theme.textMuted, fontSize: 13 }}>
                Selection: {selW} × {selH} px
              </Text>
              <View style={{ flexDirection: 'row', gap: 18 }}>
                <Pressable onPress={onReset} hitSlop={8}>
                  <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>Reset</Text>
                </Pressable>
                <Pressable onPress={onPick} hitSlop={8}>
                  <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>Change</Text>
                </Pressable>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Text style={[styles.label, { color: theme.text }]}>Aspect ratio</Text>
              <View style={styles.chips}>
                {RATIOS.map((r) => (
                  <Chip key={r.key} label={r.label} selected={ratioKey === r.key} onPress={() => onSelectRatio(r.key)} />
                ))}
              </View>
              <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 14 }}>
                Drag the box to move it, and drag a corner to resize.
              </Text>
            </View>

            <GradientButton label="Crop image" onPress={onCrop} loading={busy} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingBottom: 48, gap: 16 },
  box: { borderRadius: 24, borderWidth: 1, overflow: 'hidden', alignItems: 'center' },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 },
  card: { borderRadius: 24, borderWidth: 1, padding: 20 },
  label: { fontSize: 15, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  statsRow: { flexDirection: 'row', gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
});