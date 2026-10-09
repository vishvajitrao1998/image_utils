import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import AppHeader from '../components/AppHeader';
import Chip from '../components/Chip';
import GradientButton from '../components/GradientButton';
import ImageDropzone from '../components/ImageDropzone';
import OutlineButton from '../components/OutlineButton';
import Segmented from '../components/Segmented';
import Stat from '../components/Stat';
import { RESIZE_PRESETS } from '../constants/resizePresets';
import { PickedImage, pickImage, saveToGallery, shareImage } from '../services/imageActions';
import { FitMode, ResizeFormat, resizeImage, ResizeResult } from '../services/imageResizer';
import { useTheme } from '../theme';
import { formatBytes } from '../utils/format';

const MAX_SIDE = 8000;
type Mode = 'custom' | 'percent' | 'presets';

export default function Resize() {
  const { theme } = useTheme();
  const router = useRouter();

  const [original, setOriginal] = useState<PickedImage | null>(null);
  const [result, setResult] = useState<ResizeResult | null>(null);
  const [showResized, setShowResized] = useState(true);

  const [mode, setMode] = useState<Mode>('custom');
  const [w, setW] = useState('');
  const [h, setH] = useState('');
  const [lock, setLock] = useState(true);
  const [percent, setPercent] = useState(50);
  const [presetId, setPresetId] = useState(RESIZE_PRESETS[0].id);

  const [format, setFormat] = useState<ResizeFormat>('jpeg');
  const [quality, setQuality] = useState(0.9);
  const [busy, setBusy] = useState(false);

  const onPick = async () => {
    const img = await pickImage();
    if (!img) return;
    setOriginal(img);
    setResult(null);
    setShowResized(true);
    setW(String(img.width));
    setH(String(img.height));
  };

  const onChangeWidth = (t: string) => {
    const clean = t.replace(/[^0-9]/g, '');
    setW(clean);
    if (lock && original) {
      const n = parseInt(clean, 10);
      setH(n > 0 ? String(Math.round((n * original.height) / original.width)) : '');
    }
  };

  const onChangeHeight = (t: string) => {
    const clean = t.replace(/[^0-9]/g, '');
    setH(clean);
    if (lock && original) {
      const n = parseInt(clean, 10);
      setW(n > 0 ? String(Math.round((n * original.width) / original.height)) : '');
    }
  };

  const toggleLock = () => {
    const next = !lock;
    setLock(next);
    if (next && original) {
      const n = parseInt(w, 10);
      if (n > 0) setH(String(Math.round((n * original.height) / original.width)));
    }
  };

  const target = useMemo(() => {
    if (!original) return null;
    if (mode === 'custom') {
      const tw = parseInt(w, 10);
      const th = parseInt(h, 10);
      return tw > 0 && th > 0 ? { w: tw, h: th, fit: 'stretch' as FitMode } : null;
    }
    if (mode === 'percent') {
      return {
        w: Math.max(1, Math.round((original.width * percent) / 100)),
        h: Math.max(1, Math.round((original.height * percent) / 100)),
        fit: 'stretch' as FitMode,
      };
    }
    const p = RESIZE_PRESETS.find((x) => x.id === presetId);
    return p ? { w: p.w, h: p.h, fit: 'cover' as FitMode } : null;
  }, [original, mode, w, h, percent, presetId]);

  const onResize = async () => {
    if (!original || !target) {
      Alert.alert('Enter a size', 'Please enter a valid width and height.');
      return;
    }
    if (target.w > MAX_SIDE || target.h > MAX_SIDE) {
      Alert.alert('Too large', `Each side must be ${MAX_SIDE}px or less.`);
      return;
    }
    try {
      setBusy(true);
      const out = await resizeImage({
        uri: original.uri,
        originalWidth: original.width,
        originalHeight: original.height,
        targetWidth: target.w,
        targetHeight: target.h,
        fit: target.fit,
        format,
        quality,
      });
      setResult(out);
      setShowResized(true);
    } catch {
      Alert.alert('Resize failed', 'Something went wrong while resizing this image.');
    } finally {
      setBusy(false);
    }
  };

  const showingResult = !!result && showResized;
  const previewUri = showingResult ? result!.uri : original?.uri;
  const aspect = original
    ? showingResult
      ? result!.width / result!.height
      : original.width / original.height
    : 1;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <AppHeader title="Image Resizer" onBack={() => router.back()} />

      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
      >
        {/* Picker / preview */}
        {!original ? (
          <ImageDropzone onPress={onPick} />
        ) : (
          <View>
            <Pressable
              onPress={() => result && setShowResized((v) => !v)}
              style={[styles.previewWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}
            >
              <Image
                source={{ uri: previewUri }}
                style={{ width: '100%', aspectRatio: aspect, maxHeight: 340 }}
                resizeMode="contain"
              />
              {result && (
                <View style={[styles.badge, { backgroundColor: theme.bg }]}>
                  <Text style={{ color: theme.text, fontSize: 12, fontWeight: '700' }}>
                    {showResized ? 'RESIZED' : 'ORIGINAL'}
                  </Text>
                </View>
              )}
            </Pressable>
            <View style={styles.previewMeta}>
              <Text style={{ color: theme.textMuted, fontSize: 13 }}>
                {result
                  ? 'Tap the image to compare'
                  : `${original.width} × ${original.height} px · ${formatBytes(original.size)}`}
              </Text>
              <Pressable onPress={onPick} hitSlop={8}>
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>Change</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Settings */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Segmented<Mode>
            value={mode}
            onChange={setMode}
            options={[
              { label: 'Custom', value: 'custom' },
              { label: 'Percent', value: 'percent' },
              { label: 'Presets', value: 'presets' },
            ]}
          />

          {mode === 'custom' && (
            <View style={styles.dimRow}>
              <DimInput label="Width" value={w} onChangeText={onChangeWidth} editable={!!original} />
              <Pressable
                onPress={toggleLock}
                hitSlop={8}
                style={[styles.lockBtn, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}
              >
                <Ionicons name={lock ? 'link' : 'unlink'} size={20} color={theme.text} />
              </Pressable>
              <DimInput label="Height" value={h} onChangeText={onChangeHeight} editable={!!original} />
            </View>
          )}
          {mode === 'custom' && (
            <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 10 }}>
              {lock ? 'Aspect ratio locked, so the image will not stretch.' : 'Unlocked: the image may stretch.'}
            </Text>
          )}

          {mode === 'percent' && (
            <View style={{ marginTop: 18 }}>
              <View style={styles.rowBetween}>
                <Text style={[styles.label, { color: theme.text }]}>Scale</Text>
                <Text style={[styles.label, { color: theme.text }]}>{percent}%</Text>
              </View>
              <Slider
                style={{ height: 40, marginHorizontal: -4 }}
                minimumValue={10}
                maximumValue={200}
                step={5}
                value={percent}
                onValueChange={setPercent}
                minimumTrackTintColor={theme.text}
                maximumTrackTintColor={theme.border}
                thumbTintColor={theme.text}
              />
              <View style={styles.chips}>
                {[25, 50, 75, 100].map((p) => (
                  <Chip key={p} label={`${p}%`} selected={percent === p} onPress={() => setPercent(p)} />
                ))}
              </View>
            </View>
          )}

          {mode === 'presets' && (
            <View style={{ marginTop: 18 }}>
              <View style={styles.presetGrid}>
                {RESIZE_PRESETS.map((p) => {
                  const active = p.id === presetId;
                  return (
                    <Pressable
                      key={p.id}
                      onPress={() => setPresetId(p.id)}
                      style={[
                        styles.preset,
                        {
                          backgroundColor: theme.surfaceAlt,
                          borderColor: active ? theme.text : theme.border,
                          borderWidth: active ? 2 : 1,
                        },
                      ]}
                    >
                      <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>{p.label}</Text>
                      <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 2 }}>
                        {p.w} × {p.h}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 10 }}>
                Presets fill the exact size and crop the edges from the center.
              </Text>
            </View>
          )}

          {target && original && (
            <View style={[styles.targetBox, { backgroundColor: theme.surfaceAlt }]}>
              <Text style={{ color: theme.textMuted, fontSize: 13 }}>New size</Text>
              <Text style={{ color: theme.text, fontWeight: '800', fontSize: 15 }}>
                {target.w} × {target.h} px
              </Text>
            </View>
          )}

          <Text style={[styles.label, { color: theme.text, marginTop: 20 }]}>Format</Text>
          <View style={styles.chips}>
            <Chip label="JPEG" selected={format === 'jpeg'} onPress={() => setFormat('jpeg')} />
            <Chip label="PNG" selected={format === 'png'} onPress={() => setFormat('png')} />
            {Platform.OS !== 'ios' && (
              <Chip label="WebP" selected={format === 'webp'} onPress={() => setFormat('webp')} />
            )}
          </View>

          {format !== 'png' && (
            <View style={{ marginTop: 16 }}>
              <View style={styles.rowBetween}>
                <Text style={[styles.label, { color: theme.text }]}>Quality</Text>
                <Text style={[styles.label, { color: theme.text }]}>{Math.round(quality * 100)}%</Text>
              </View>
              <Slider
                style={{ height: 40, marginHorizontal: -4 }}
                minimumValue={0.1}
                maximumValue={1}
                step={0.05}
                value={quality}
                onValueChange={setQuality}
                minimumTrackTintColor={theme.text}
                maximumTrackTintColor={theme.border}
                thumbTintColor={theme.text}
              />
            </View>
          )}
        </View>

        {/* Stats */}
        {result && original && (
          <View style={styles.statsRow}>
            <Stat label="Original" value={`${original.width}×${original.height}`} />
            <Stat label="New" value={`${result.width}×${result.height}`} />
            <Stat label="File size" value={formatBytes(result.size)} />
          </View>
        )}

        {/* Actions */}
        <GradientButton
          label={result ? 'Resize Again' : 'Resize Image'}
          onPress={onResize}
          loading={busy}
          disabled={!original || !target}
          style={{ marginTop: 8 }}
        />

        {result && (
          <View style={styles.actionsRow}>
            <OutlineButton icon="download-outline" label="Save" onPress={() => saveToGallery(result.uri)} />
            <OutlineButton icon="share-outline" label="Share" onPress={() => shareImage(result.uri)} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function DimInput({
  label, value, onChangeText, editable,
}: { label: string; value: string; onChangeText: (t: string) => void; editable: boolean }) {
  const { theme } = useTheme();
  return (
    <View style={{ flex: 1 }}>
      <Text style={{ color: theme.textMuted, fontSize: 12, marginBottom: 6 }}>{label} (px)</Text>
      <TextInput
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        keyboardType="number-pad"
        maxLength={5}
        placeholder="0"
        placeholderTextColor={theme.textMuted}
        style={[
          styles.input,
          { backgroundColor: theme.surfaceAlt, borderColor: theme.border, color: theme.text },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingBottom: 48, gap: 16 },
  previewWrap: { borderRadius: 24, borderWidth: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  previewMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 4 },
  card: { borderRadius: 24, borderWidth: 1, padding: 20 },
  dimRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: 18 },
  lockBtn: { width: 44, height: 48, borderRadius: 14, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
  input: { height: 48, borderRadius: 14, borderWidth: 1, paddingHorizontal: 14, fontSize: 17, fontWeight: '700' },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 15, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  presetGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  preset: { width: '48%', borderRadius: 14, padding: 12 },
  targetBox: {
    marginTop: 18, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
  },
  statsRow: { flexDirection: 'row', gap: 12 },
  actionsRow: { flexDirection: 'row', gap: 12 },
});