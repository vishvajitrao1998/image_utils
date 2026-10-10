import Slider from '@react-native-community/slider';
import { Blur, Canvas, ColorMatrix, Group, Paint, Image as SkImage, useImage } from '@shopify/react-native-skia';
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
import GradientButton from '../components/GradientButton';
import ImageDropzone from '../components/ImageDropzone';
import OutlineButton from '../components/OutlineButton';
import Stat from '../components/Stat';
import { PickedImage, pickImage, saveToGallery, shareImage } from '../services/imageActions';
import { prepareImage } from '../services/imageMerger';
import { exportSketch, SketchResult } from '../services/imageSketch';
import { useTheme } from '../theme';
import { formatBytes, getImageFormat } from '../utils/format';
import { buildSketchMatrices, Paper, SketchParams, sketchSigmaFraction, SketchStyle } from '../utils/sketchMatrix';

const MAX_PREVIEW_H = 380;

const STYLES: { id: SketchStyle; label: string }[] = [
  { id: 'pencil', label: 'Pencil' },
  { id: 'color', label: 'Color' },
  { id: 'ink', label: 'Ink' },
];

const PAPERS: { id: Paper; label: string }[] = [
  { id: 'white', label: 'White' },
  { id: 'cream', label: 'Cream' },
  { id: 'cool', label: 'Cool' },
];

export default function Sketch() {
  const { theme } = useTheme();
  const router = useRouter();
  const { width: screenW } = useWindowDimensions();

  const [original, setOriginal] = useState<PickedImage | null>(null); // uri = prepared copy
  const [originalSize, setOriginalSize] = useState(0);
  const [preparing, setPreparing] = useState(false);

  const [style, setStyle] = useState<SketchStyle>('pencil');
  const [thickness, setThickness] = useState(3);
  const [darkness, setDarkness] = useState(1.2);
  const [paper, setPaper] = useState<Paper>('white');
  const [chalk, setChalk] = useState(false);
  const [format, setFormat] = useState<'jpeg' | 'png'>('jpeg');

  const [holding, setHolding] = useState(false);
  const [result, setResult] = useState<SketchResult | null>(null);
  const [busy, setBusy] = useState(false);

  const skImage = useImage(original?.uri);

  const params: SketchParams = { style, thickness, darkness, paper, chalk };
  const mats = useMemo(() => buildSketchMatrices(params), [style, thickness, darkness, paper, chalk]);

  const onPick = async () => {
    const img = await pickImage();
    if (!img) return;
    try {
      setPreparing(true);
      const isPng = getImageFormat(img) === 'PNG';
      const prepared = await prepareImage(img, isPng);
      setOriginal({ ...img, ...prepared });
      setOriginalSize(img.size);
      setFormat(isPng ? 'png' : 'jpeg');
      setResult(null);
    } catch {
      Alert.alert('Could not open image', 'Please try a different image.');
    } finally {
      setPreparing(false);
    }
  };

  const onReset = () => {
    setStyle('pencil');
    setThickness(3);
    setDarkness(1.2);
    setPaper('white');
    setChalk(false);
  };

  const onCreate = async () => {
    if (!original) return;
    try {
      setBusy(true);
      setResult(await exportSketch({ uri: original.uri, params, format }));
    } catch (e: any) {
      console.warn('Sketch export failed', e);
      Alert.alert('Failed', e?.message ?? 'Something went wrong while creating the sketch.');
    } finally {
      setBusy(false);
    }
  };

  // Preview size
  let pw = 0;
  let ph = 0;
  if (original) {
    const s = Math.min((screenW - 40) / original.width, MAX_PREVIEW_H / original.height);
    pw = original.width * s;
    ph = original.height * s;
  }
  const sigma = Math.max(0.5, sketchSigmaFraction(thickness) * pw);

  const change = result && originalSize ? Math.round((result.size / originalSize - 1) * 100) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <AppHeader title="Sketch" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {preparing ? (
          <View style={[styles.box, { backgroundColor: theme.surface, borderColor: theme.border, height: 200 }]}>
            <ActivityIndicator color={theme.text} />
            <Text style={{ color: theme.textMuted, marginTop: 10 }}>Preparing image…</Text>
          </View>
        ) : !original ? (
          <ImageDropzone onPress={onPick} />
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
              <Stat label="Original" value={formatBytes(originalSize)} />
              <Stat label="Sketch" value={formatBytes(result.size)} />
              <Stat label="Change" value={`${change > 0 ? '+' : ''}${change}%`} />
            </View>

            <View style={styles.row}>
              <OutlineButton icon="download-outline" label="Save" onPress={() => saveToGallery(result.uri)} />
              <OutlineButton icon="share-outline" label="Share" onPress={() => shareImage(result.uri)} />
            </View>
            <View style={styles.row}>
              <OutlineButton icon="brush-outline" label="Edit Again" onPress={() => setResult(null)} />
              <OutlineButton icon="images-outline" label="New image" onPress={onPick} />
            </View>
          </>
        ) : (
          /* ---------- Editor ---------- */
          <>
            <Pressable
              onPressIn={() => setHolding(true)}
              onPressOut={() => setHolding(false)}
              style={[styles.box, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <Canvas style={{ width: pw, height: ph }}>
                {skImage &&
                  (holding ? (
                    <SkImage image={skImage} x={0} y={0} width={pw} height={ph} fit="fill" />
                  ) : (
                    <Group layer={<Paint><ColorMatrix matrix={mats.final} /></Paint>}>
                      <SkImage image={skImage} x={0} y={0} width={pw} height={ph} fit="fill">
                        <ColorMatrix matrix={mats.base} />
                      </SkImage>
                      <SkImage image={skImage} x={0} y={0} width={pw} height={ph} fit="fill" blendMode="colorDodge">
                        <ColorMatrix matrix={mats.dodge} />
                        <Blur blur={sigma} mode="clamp" />
                      </SkImage>
                    </Group>
                  ))}
              </Canvas>
              <View style={[styles.badge, { backgroundColor: theme.bg }]}>
                <Text style={{ color: theme.text, fontSize: 12, fontWeight: '700' }}>
                  {holding ? 'ORIGINAL' : 'PREVIEW'}
                </Text>
              </View>
            </Pressable>

            <View style={styles.metaRow}>
              <Text style={{ color: theme.textMuted, fontSize: 13, flex: 1 }}>
                Press and hold the image to see the original
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
              <Text style={[styles.label, { color: theme.text }]}>Style</Text>
              <View style={styles.chips}>
                {STYLES.map((s) => (
                  <Chip key={s.id} label={s.label} selected={style === s.id} onPress={() => setStyle(s.id)} />
                ))}
              </View>
              <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 10 }}>
                {style === 'pencil' && 'A graphite pencil drawing in shades of gray.'}
                {style === 'color' && 'A colored-pencil look that keeps the photo colors.'}
                {style === 'ink' && 'Bold black ink lines on white, like a line drawing.'}
              </Text>

              <LabeledSlider
                label="Line thickness"
                valueText={`${thickness}`}
                min={1}
                max={10}
                step={1}
                value={thickness}
                onChange={setThickness}
              />
              <LabeledSlider
                label="Darkness"
                valueText={`${Math.round(darkness * 100)}%`}
                min={0.5}
                max={3}
                step={0.1}
                value={darkness}
                onChange={setDarkness}
              />

              {!chalk && (
                <>
                  <Text style={[styles.label, { color: theme.text, marginTop: 20 }]}>Paper</Text>
                  <View style={styles.chips}>
                    {PAPERS.map((p) => (
                      <Chip key={p.id} label={p.label} selected={paper === p.id} onPress={() => setPaper(p.id)} />
                    ))}
                  </View>
                </>
              )}

              <View style={[styles.switchRow, { borderTopColor: theme.border }]}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={[styles.label, { color: theme.text }]}>Chalkboard</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>
                    White lines on a dark background
                  </Text>
                </View>
                <Switch
                  value={chalk}
                  onValueChange={setChalk}
                  trackColor={{ false: theme.border, true: theme.text }}
                  thumbColor={theme.bg}
                />
              </View>

              <Text style={[styles.label, { color: theme.text, marginTop: 20 }]}>Save as</Text>
              <View style={styles.chips}>
                <Chip label="JPG" selected={format === 'jpeg'} onPress={() => setFormat('jpeg')} />
                <Chip label="PNG" selected={format === 'png'} onPress={() => setFormat('png')} />
              </View>
            </View>

            <GradientButton label="Create Sketch" onPress={onCreate} loading={busy} />
          </>
        )}
      </ScrollView>
    </View>
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
  badge: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingHorizontal: 4 },
  card: { borderRadius: 24, borderWidth: 1, padding: 20 },
  label: { fontSize: 15, fontWeight: '700' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  switchRow: { flexDirection: 'row', alignItems: 'center', marginTop: 20, paddingTop: 16, borderTopWidth: 1 },
  statsRow: { flexDirection: 'row', gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
});