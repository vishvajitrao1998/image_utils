import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image, Pressable, ScrollView,
  StyleSheet,
  Switch,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';

import AppHeader from '../components/AppHeader';
import GradientButton from '../components/GradientButton';
import ImageDropzone from '../components/ImageDropzone';
import OutlineButton from '../components/OutlineButton';
import Stat from '../components/Stat';
import { PickedImage, pickImage, saveToGallery, shareImage } from '../services/imageActions';
import { transformImage, TransformResult } from '../services/imageTransformer';
import { useTheme } from '../theme';
import { formatBytes, getImageFormat } from '../utils/format';
import { tiltGeometry } from '../utils/geometry';

const AREA_H = 320;
const MAX_TILT = 45;
const norm = (d: number) => ((d % 360) + 360) % 360;

export default function RotateFlip() {
  const { theme } = useTheme();
  const router = useRouter();
  const { width: screenW } = useWindowDimensions();
  const areaW = screenW - 40 - 32; // screen padding + card padding

  const [original, setOriginal] = useState<PickedImage | null>(null);
  const [rotation, setRotation] = useState(0); // 90° steps
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [tilt, setTilt] = useState(0); // fine rotation
  const [autoCrop, setAutoCrop] = useState(true);
  const [result, setResult] = useState<TransformResult | null>(null);
  const [busy, setBusy] = useState(false);

  const changed = rotation !== 0 || flipH || flipV || tilt !== 0;

  const onReset = () => {
    setRotation(0);
    setFlipH(false);
    setFlipV(false);
    setTilt(0);
  };

  const onPick = async () => {
    const img = await pickImage();
    if (!img) return;
    setOriginal(img);
    setResult(null);
    onReset();
  };

  // State means: rotate first, then flip. When exactly one flip is active the image is
  // mirrored, so a visual clockwise turn becomes a counter-clockwise turn in this frame.
  const rotateBy = (delta: number) => {
    const mirrored = flipH !== flipV;
    setRotation((r) => norm(mirrored ? r - delta : r + delta));
  };

  const onApply = async () => {
    if (!original || !changed) return;
    try {
      setBusy(true);
      const keepCorners = tilt !== 0 && !autoCrop; // empty corners need transparency, so use PNG
      const out = await transformImage({
        uri: original.uri,
        originalWidth: original.width,
        originalHeight: original.height,
        rotation,
        flipH,
        flipV,
        tilt,
        autoCrop,
        format: getImageFormat(original) === 'PNG' || keepCorners ? 'png' : 'jpeg',
      });
      setResult(out);
    } catch {
      Alert.alert('Failed', 'Something went wrong while processing this image.');
    } finally {
      setBusy(false);
    }
  };

  // Preview: a fixed "window" showing the output area, with the image rotating inside it
  let ww = 0; // window size
  let wh = 0;
  let ew = 0; // image element size (unrotated)
  let eh = 0;
  if (original) {
    const odd = rotation % 180 !== 0;
    const w0 = odd ? original.height : original.width;
    const h0 = odd ? original.width : original.height;
    const g = tiltGeometry(w0, h0, tilt);
    const cw = autoCrop ? g.cropW : g.boundW;
    const ch = autoCrop ? g.cropH : g.boundH;
    const k = Math.min(areaW / cw, AREA_H / ch);
    ww = cw * k;
    wh = ch * k;
    ew = original.width * k;
    eh = original.height * k;
  }

  const status = [
    rotation ? `Rotated ${rotation}°` : null,
    tilt ? `Tilted ${tilt > 0 ? '+' : ''}${tilt}°` : null,
    flipH ? 'Flipped horizontally' : null,
    flipV ? 'Flipped vertically' : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <AppHeader title="Rotate & Flip" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
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
              <OutlineButton icon="sync-outline" label="Edit Again" onPress={() => setResult(null)} />
              <OutlineButton icon="images-outline" label="New image" onPress={onPick} />
            </View>
          </>
        ) : (
          /* ---------- Editor ---------- */
          <>
            <View style={[styles.box, styles.previewBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={{ height: AREA_H, width: areaW, alignItems: 'center', justifyContent: 'center' }}>
                <View
                  style={{
                    width: ww,
                    height: wh,
                    overflow: 'hidden',
                    borderRadius: 4,
                    backgroundColor: theme.surfaceAlt,
                  }}
                >
                  <Image
                    source={{ uri: original.uri }}
                    resizeMode="stretch"
                    style={{
                      position: 'absolute',
                      left: (ww - ew) / 2,
                      top: (wh - eh) / 2,
                      width: ew,
                      height: eh,
                      transform: [
                        { rotate: `${tilt}deg` },
                        { scaleX: flipH ? -1 : 1 },
                        { scaleY: flipV ? -1 : 1 },
                        { rotate: `${rotation}deg` },
                      ],
                    }}
                  />
                </View>
              </View>
            </View>

            <View style={styles.metaRow}>
              <Text style={{ color: theme.textMuted, fontSize: 13, flex: 1 }}>
                {status || `${original.width} × ${original.height} px · no changes yet`}
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

            {/* 90° and flip buttons */}
            <View style={styles.grid}>
              <ActionTile icon="refresh-outline" mirror label="Rotate left" onPress={() => rotateBy(-90)} />
              <ActionTile icon="refresh-outline" label="Rotate right" onPress={() => rotateBy(90)} />
              <ActionTile
                icon="swap-horizontal-outline"
                label="Flip horizontal"
                active={flipH}
                onPress={() => setFlipH((v) => !v)}
              />
              <ActionTile
                icon="swap-vertical-outline"
                label="Flip vertical"
                active={flipV}
                onPress={() => setFlipV((v) => !v)}
              />
            </View>

            {/* Fine rotation slider */}
            <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <View style={styles.rowBetween}>
                <Text style={[styles.label, { color: theme.text }]}>Fine rotate</Text>
                <Pressable onPress={() => setTilt(0)} hitSlop={8}>
                  <Text style={[styles.label, { color: theme.text }]}>
                    {tilt > 0 ? '+' : ''}
                    {tilt}°
                  </Text>
                </Pressable>
              </View>

              <Slider
                style={{ height: 40, marginHorizontal: -4 }}
                minimumValue={-MAX_TILT}
                maximumValue={MAX_TILT}
                step={1}
                value={tilt}
                onValueChange={setTilt}
                minimumTrackTintColor={theme.text}
                maximumTrackTintColor={theme.border}
                thumbTintColor={theme.text}
              />
              <View style={styles.rowBetween}>
                <Text style={styles.tick(theme.textMuted)}>-{MAX_TILT}°</Text>
                <Text style={styles.tick(theme.textMuted)}>0°</Text>
                <Text style={styles.tick(theme.textMuted)}>{MAX_TILT}°</Text>
              </View>

              <View style={[styles.switchRow, { borderTopColor: theme.border }]}>
                <View style={{ flex: 1, paddingRight: 12 }}>
                  <Text style={[styles.label, { color: theme.text }]}>Auto-crop edges</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>
                    {autoCrop
                      ? 'Trims the empty corners left by tilting.'
                      : 'Keeps the full canvas. Corners are transparent and the file is saved as PNG.'}
                  </Text>
                </View>
                <Switch
                  value={autoCrop}
                  onValueChange={setAutoCrop}
                  trackColor={{ false: theme.border, true: theme.text }}
                  thumbColor={theme.bg}
                />
              </View>
            </View>

            <GradientButton label="Apply changes" onPress={onApply} loading={busy} disabled={!changed} />
          </>
        )}
      </ScrollView>
    </View>
  );
}

function ActionTile({
  icon, label, onPress, active, mirror,
}: {
  icon: React.ComponentProps<typeof Ionicons>['name'];
  label: string;
  onPress: () => void;
  active?: boolean;
  mirror?: boolean;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.tile,
        {
          backgroundColor: theme.surface,
          borderColor: active ? theme.text : theme.border,
          borderWidth: active ? 2 : 1,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={[styles.tileIcon, { backgroundColor: theme.surfaceAlt }]}>
        <Ionicons name={icon} size={24} color={theme.text} style={mirror ? { transform: [{ scaleX: -1 }] } : undefined} />
      </View>
      <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>{label}</Text>
    </Pressable>
  );
}

const styles = {
  ...StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingBottom: 48, gap: 16 },
    box: { borderRadius: 24, borderWidth: 1, overflow: 'hidden', alignItems: 'center' },
    previewBox: { padding: 16 },
    metaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12, paddingHorizontal: 4 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    tile: { width: '48%', borderRadius: 20, padding: 16, gap: 12 },
    tileIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    card: { borderRadius: 24, borderWidth: 1, padding: 20 },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    label: { fontSize: 15, fontWeight: '700' },
    switchRow: {
      flexDirection: 'row', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1,
    },
    statsRow: { flexDirection: 'row', gap: 12 },
    row: { flexDirection: 'row', gap: 12 },
  }),
  tick: (color: string) => ({ color, fontSize: 12 }),
};