import Slider from '@react-native-community/slider';
import { Canvas, ColorMatrix, Image as SkImage, useImage } from '@shopify/react-native-skia';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image, Pressable, ScrollView,
  StyleSheet,
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
import { exportGrayscale, GrayResult, normalizeImage } from '../services/imageGrayscale';
import { useTheme } from '../theme';
import { formatBytes, getImageFormat } from '../utils/format';
import { buildGrayMatrix, GRAY_METHODS, GrayMethod } from '../utils/grayMatrix';

const MAX_PREVIEW_H = 360;

export default function Grayscale() {
  const { theme } = useTheme();
  const router = useRouter();
  const { width: screenW } = useWindowDimensions();

  const [original, setOriginal] = useState<PickedImage | null>(null); // uri points at the normalized copy
  const [originalSize, setOriginalSize] = useState(0);
  const [preparing, setPreparing] = useState(false);

  const [method, setMethod] = useState<GrayMethod>('natural');
  const [amount, setAmount] = useState(1);
  const [contrast, setContrast] = useState(1);
  const [brightness, setBrightness] = useState(0);
  const [format, setFormat] = useState<'jpeg' | 'png'>('jpeg');

  const [holding, setHolding] = useState(false);
  const [result, setResult] = useState<GrayResult | null>(null);
  const [busy, setBusy] = useState(false);

  const skImage = useImage(original?.uri);

  const matrix = useMemo(() => {
    const weights = GRAY_METHODS.find((m) => m.id === method)!.weights;
    return buildGrayMatrix(weights, amount, contrast, brightness);
  }, [method, amount, contrast, brightness]);

  const onPick = async () => {
    const img = await pickImage();
    if (!img) return;
    try {
      setPreparing(true);
      const isPng = getImageFormat(img) === 'PNG';
      const norm = await normalizeImage(img.uri, isPng);
      setOriginal({ ...img, uri: norm.uri, width: norm.width, height: norm.height });
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
    setMethod('natural');
    setAmount(1);
    setContrast(1);
    setBrightness(0);
  };

  const onConvert = async () => {
    if (!original) return;
    try {
      setBusy(true);
      setResult(await exportGrayscale({ uri: original.uri, matrix, format }));
    } catch (e: any) {
      console.warn('Grayscale export failed', e);
      Alert.alert('Conversion failed', e?.message ?? 'Something went wrong while converting this image.');
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

  const change = result && originalSize ? Math.round((result.size / originalSize - 1) * 100) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <AppHeader title="Image to Grayscale" onBack={() => router.back()} />

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
                style={{ width: '100%', aspectRatio: result.width / result.height, maxHeight: 360 }}
                resizeMode="contain"
              />
            </View>

            <View style={styles.statsRow}>
              <Stat label="Original" value={formatBytes(originalSize)} />
              <Stat label="Grayscale" value={formatBytes(result.size)} />
              <Stat label="Change" value={`${change > 0 ? '+' : ''}${change}%`} />
            </View>

            <View style={styles.row}>
              <OutlineButton icon="download-outline" label="Save" onPress={() => saveToGallery(result.uri)} />
              <OutlineButton icon="share-outline" label="Share" onPress={() => shareImage(result.uri)} />
            </View>
            <View style={styles.row}>
              <OutlineButton icon="contrast-outline" label="Edit again" onPress={() => setResult(null)} />
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
                {skImage && (
                  <SkImage image={skImage} x={0} y={0} width={pw} height={ph} fit="fill">
                    {!holding && <ColorMatrix matrix={matrix} />}
                  </SkImage>
                )}
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
              <Text style={[styles.label, { color: theme.text }]}>Method</Text>
              <View style={styles.chips}>
                {GRAY_METHODS.map((m) => (
                  <Chip key={m.id} label={m.label} selected={method === m.id} onPress={() => setMethod(m.id)} />
                ))}
              </View>
              <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 10 }}>
                Color filters mimic black-and-white photography: a red filter darkens skies and brightens skin.
              </Text>

              <LabeledSlider
                label="Amount"
                valueText={`${Math.round(amount * 100)}%`}
                min={0}
                max={1}
                step={0.05}
                value={amount}
                onChange={setAmount}
              />
              <LabeledSlider
                label="Contrast"
                valueText={`${Math.round(contrast * 100)}%`}
                min={0.5}
                max={1.5}
                step={0.05}
                value={contrast}
                onChange={setContrast}
              />
              <LabeledSlider
                label="Brightness"
                valueText={`${brightness > 0 ? '+' : ''}${Math.round(brightness * 100)}`}
                min={-0.3}
                max={0.3}
                step={0.02}
                value={brightness}
                onChange={setBrightness}
              />

              <Text style={[styles.label, { color: theme.text, marginTop: 20 }]}>Save as</Text>
              <View style={styles.chips}>
                <Chip label="JPG" selected={format === 'jpeg'} onPress={() => setFormat('jpeg')} />
                <Chip label="PNG" selected={format === 'png'} onPress={() => setFormat('png')} />
              </View>
            </View>

            <GradientButton label="Convert to Grayscale" onPress={onConvert} loading={busy} />
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
  statsRow: { flexDirection: 'row', gap: 12 },
  row: { flexDirection: 'row', gap: 12 },
});