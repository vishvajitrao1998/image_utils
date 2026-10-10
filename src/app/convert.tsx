import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import AppHeader from '../components/AppHeader';
import GradientButton from '../components/GradientButton';
import ImageDropzone from '../components/ImageDropzone';
import OutlineButton from '../components/OutlineButton';
import Stat from '../components/Stat';
import { PickedImage, pickImage, saveToGallery, shareImage } from '../services/imageActions';
import { convertImage, ConvertResult, TargetFormat } from '../services/imageConverter';
import { useTheme } from '../theme';
import { formatBytes, getImageFormat } from '../utils/format';

const OPTIONS: { id: TargetFormat; label: string; sub: string }[] = [
  { id: 'jpg', label: 'JPG', sub: 'Small, great for photos' },
  { id: 'png', label: 'PNG', sub: 'Lossless, keeps transparency' },
  { id: 'webp', label: 'WebP', sub: 'Modern and compact' },
  { id: 'bmp', label: 'BMP', sub: 'Uncompressed bitmap' },
];

export default function Convert() {
  const { theme } = useTheme();
  const router = useRouter();

  const [original, setOriginal] = useState<PickedImage | null>(null);
  const [target, setTarget] = useState<TargetFormat>('jpg');
  const [result, setResult] = useState<ConvertResult | null>(null);
  const [busy, setBusy] = useState(false);

  const options = OPTIONS.filter((o) => !(o.id === 'webp' && Platform.OS === 'ios'));
  const sourceLabel = original ? getImageFormat(original) : '';
  const targetLabel = OPTIONS.find((o) => o.id === target)!.label;

  const onPick = async () => {
    const img = await pickImage();
    if (!img) return;
    setOriginal(img);
    setResult(null);
  };

  const onSelect = (id: TargetFormat) => {
    setTarget(id);
    setResult(null); // old result is a different format now
  };

  const onConvert = async () => {
    if (!original) return;
    try {
      setBusy(true);
      setResult(await convertImage(original.uri, target));
    } catch {
      Alert.alert('Conversion failed', 'Something went wrong while converting this image.');
    } finally {
      setBusy(false);
    }
  };

  const change = original && result ? Math.round((result.size / original.size - 1) * 100) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <AppHeader title="Image Converter" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {!original ? (
          <ImageDropzone onPress={onPick} />
        ) : (
          <View>
            <View style={[styles.previewWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Image
                source={{ uri: original.uri }}
                style={{ width: '100%', aspectRatio: original.width / original.height, maxHeight: 300 }}
                resizeMode="contain"
              />
            </View>
            <View style={styles.previewMeta}>
              <Text style={{ color: theme.textMuted, fontSize: 13 }}>
                {sourceLabel} · {original.width} × {original.height} px · {formatBytes(original.size)}
              </Text>
              <Pressable onPress={onPick} hitSlop={8}>
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>Change</Text>
              </Pressable>
            </View>
          </View>
        )}

        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <View style={styles.flowRow}>
            <Text style={[styles.flowText, { color: theme.textMuted }]}>{original ? sourceLabel : '—'}</Text>
            <Ionicons name="arrow-forward" size={18} color={theme.textMuted} />
            <Text style={[styles.flowText, { color: theme.text }]}>{targetLabel}</Text>
          </View>

          <Text style={[styles.label, { color: theme.text, marginTop: 18 }]}>Convert to</Text>
          <View style={styles.grid}>
            {options.map((o) => {
              const active = o.id === target;
              return (
                <Pressable
                  key={o.id}
                  onPress={() => onSelect(o.id)}
                  style={[
                    styles.option,
                    {
                      backgroundColor: theme.surfaceAlt,
                      borderColor: active ? theme.text : theme.border,
                      borderWidth: active ? 2 : 1,
                    },
                  ]}
                >
                  <Text style={{ color: theme.text, fontSize: 20, fontWeight: '800' }}>{o.label}</Text>
                  <Text style={{ color: theme.textMuted, fontSize: 12, marginTop: 4 }}>{o.sub}</Text>
                </Pressable>
              );
            })}
          </View>

          {target === 'jpg' && (
            <Text style={styles.hint(theme.textMuted)}>JPG has no transparency, so transparent areas may turn solid.</Text>
          )}
          {target === 'bmp' && (
            <Text style={styles.hint(theme.textMuted)}>BMP files are uncompressed, so they are usually much larger. Large photos can take a few seconds.</Text>
          )}
        </View>

        {result && original && (
          <View style={styles.statsRow}>
            <Stat label={`Original · ${sourceLabel}`} value={formatBytes(original.size)} />
            <Stat label={`Converted · ${targetLabel}`} value={formatBytes(result.size)} />
            <Stat label="Change" value={`${change > 0 ? '+' : ''}${change}%`} />
          </View>
        )}

        <GradientButton
          label={result ? 'Convert Again' : `Convert to ${targetLabel}`}
          onPress={onConvert}
          loading={busy}
          disabled={!original}
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

const styles = {
  ...StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingBottom: 48, gap: 16 },
    previewWrap: { borderRadius: 24, borderWidth: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
    previewMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 4 },
    card: { borderRadius: 24, borderWidth: 1, padding: 20 },
    flowRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 14 },
    flowText: { fontSize: 22, fontWeight: '800' },
    label: { fontSize: 15, fontWeight: '700' },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
    option: { width: '48%', borderRadius: 16, padding: 14 },
    statsRow: { flexDirection: 'row', gap: 12 },
    actionsRow: { flexDirection: 'row', gap: 12 },
  }),
  hint: (color: string) => ({ color, fontSize: 12, marginTop: 14 }),
};