import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useState } from 'react';
import { Alert, Image, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import AppHeader from '../components/AppHeader';
import Chip from '../components/Chip';
import GradientButton from '../components/GradientButton';
import { compressImage, CompressResult, getFileSize, OutputFormat } from '../services/imageCompressor';
import { useTheme } from '../theme';
import { formatBytes } from '../utils/format';

type Picked = { uri: string; width: number; height: number; size: number };

const WIDTH_OPTIONS: { label: string; value: number | null }[] = [
  { label: 'Original', value: null },
  { label: '1920', value: 1920 },
  { label: '1280', value: 1280 },
  { label: '1080', value: 1080 },
  { label: '720', value: 720 },
];

export default function Compressor() {
  const { theme } = useTheme();
  const router = useRouter();

  const [original, setOriginal] = useState<Picked | null>(null);
  const [result, setResult] = useState<CompressResult | null>(null);
  const [showCompressed, setShowCompressed] = useState(true);

  const [quality, setQuality] = useState(0.7);
  const [maxWidth, setMaxWidth] = useState<number | null>(null);
  const [format, setFormat] = useState<OutputFormat>('jpeg');

  const [busy, setBusy] = useState(false);

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
    if (res.canceled) return;
    const a = res.assets[0];
    const size = a.fileSize ?? (await getFileSize(a.uri));
    setOriginal({ uri: a.uri, width: a.width, height: a.height, size });
    setResult(null);
    setShowCompressed(true);
  };

  const onCompress = async () => {
    if (!original) return;
    try {
      setBusy(true);
      const out = await compressImage({
        uri: original.uri,
        originalWidth: original.width,
        quality,
        maxWidth,
        format,
      });
      setResult(out);
      setShowCompressed(true);
    } catch (e) {
      Alert.alert('Compression failed', 'Something went wrong while compressing this image.');
    } finally {
      setBusy(false);
    }
  };

   const onSave = async () => {
    if (!result) return;
    try {
      // Loaded lazily so the screen still works where the native module is missing (e.g. Expo Go)
      const MediaLibrary = await import('expo-media-library/legacy');
      const perm = await MediaLibrary.requestPermissionsAsync(true);
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Allow access to save images to your gallery.');
        return;
      }
      await MediaLibrary.saveToLibraryAsync(result.uri);
      Alert.alert('Saved', 'Compressed Image is saved to your Gallery.');
    } catch {
      // Gallery saving isn't available in this environment, so fall back to the share sheet
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(result.uri);
      } else {
        Alert.alert('Could not save', 'Saving to the gallery is not available on this device.');
      }
    }
  };

  const onShare = async () => {
    if (!result) return;
    if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(result.uri);
  };

  const savedPct = original && result ? Math.round((1 - result.size / original.size) * 100) : 0;
  const previewUri = result && showCompressed ? result.uri : original?.uri;
  const aspect = original ? original.width / original.height : 1;

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <AppHeader title="Image Compressor" onBack={() => router.back()} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Picker / preview */}
        {!original ? (
          <Pressable
            onPress={pickImage}
            style={[styles.dropzone, { borderColor: theme.border, backgroundColor: theme.surface }]}
          >
            <View style={[styles.dropIcon, { backgroundColor: theme.surfaceAlt }]}>
              <Ionicons name="cloud-upload-outline" size={30} color={theme.text} />
            </View>
            <Text style={[styles.dropTitle, { color: theme.text }]}>Choose an image</Text>
            <Text style={{ color: theme.textMuted, marginTop: 4 }}>Tap to pick from your gallery</Text>
          </Pressable>
        ) : (
          <View>
            <Pressable
              onPress={() => result && setShowCompressed((v) => !v)}
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
                    {showCompressed ? 'COMPRESSED' : 'ORIGINAL'}
                  </Text>
                </View>
              )}
            </Pressable>
            <View style={styles.previewMeta}>
              <Text style={{ color: theme.textMuted, fontSize: 13 }}>
                {result ? 'Tap the image to compare' : `${original.width} × ${original.height}`}
              </Text>
              <Pressable onPress={pickImage} hitSlop={8}>
                <Text style={{ color: theme.text, fontWeight: '700', fontSize: 14 }}>Change</Text>
              </Pressable>
            </View>
          </View>
        )}

        {/* Settings */}
        <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border }]}>
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
          <Text style={{ color: theme.textMuted, fontSize: 12 }}>Lower quality gives a smaller file.</Text>

          <Text style={[styles.label, { color: theme.text, marginTop: 20 }]}>Max width (px)</Text>
          <View style={styles.chips}>
            {WIDTH_OPTIONS.map((o) => (
              <Chip key={o.label} label={o.label} selected={maxWidth === o.value} onPress={() => setMaxWidth(o.value)} />
            ))}
          </View>

          <Text style={[styles.label, { color: theme.text, marginTop: 20 }]}>Format</Text>
          <View style={styles.chips}>
            <Chip label="JPEG" selected={format === 'jpeg'} onPress={() => setFormat('jpeg')} />
            {Platform.OS !== 'ios' && (
              <Chip label="WebP" selected={format === 'webp'} onPress={() => setFormat('webp')} />
            )}
          </View>
        </View>

        {/* Stats */}
        {result && original && (
          <View style={styles.statsRow}>
            <Stat label="Original" value={formatBytes(original.size)} />
            <Stat label="Compressed" value={formatBytes(result.size)} />
            <Stat label={savedPct >= 0 ? 'Saved' : 'Larger'} value={`${Math.abs(savedPct)}%`} />
          </View>
        )}

        {/* Actions */}
        <GradientButton
          label={result ? 'Compress Again' : 'Compress Image'}
          onPress={onCompress}
          loading={busy}
          disabled={!original}
          style={{ marginTop: 8 }}
        />

        {result && (
          <View style={styles.actionsRow}>
            <OutlineButton icon="download-outline" label="Save" onPress={onSave} />
            <OutlineButton icon="share-outline" label="Share" onPress={onShare} />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  const { theme } = useTheme();
  return (
    <View style={[styles.stat, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <Text style={{ color: theme.textMuted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: theme.text, fontSize: 18, fontWeight: '800', marginTop: 4 }}>{value}</Text>
    </View>
  );
}

function OutlineButton({ icon, label, onPress }: { icon: any; label: string; onPress: () => void }) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.outlineBtn,
        { backgroundColor: theme.surface, borderColor: theme.border, opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Ionicons name={icon} size={20} color={theme.text} />
      <Text style={{ color: theme.text, fontWeight: '700', fontSize: 16 }}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: { paddingHorizontal: 20, paddingBottom: 48, gap: 16 },
  dropzone: { borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 24, paddingVertical: 56, alignItems: 'center' },
  dropIcon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  dropTitle: { fontSize: 18, fontWeight: '700' },
  previewWrap: { borderRadius: 24, borderWidth: 1, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  badge: { position: 'absolute', top: 12, left: 12, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 },
  previewMeta: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10, paddingHorizontal: 4 },
  card: { borderRadius: 24, borderWidth: 1, padding: 20 },
  rowBetween: { flexDirection: 'row', justifyContent: 'space-between' },
  label: { fontSize: 15, fontWeight: '700' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 10 },
  statsRow: { flexDirection: 'row', gap: 12 },
  stat: { flex: 1, borderRadius: 18, borderWidth: 1, padding: 14, alignItems: 'center' },
  actionsRow: { flexDirection: 'row', gap: 12 },
  outlineBtn: {
    flex: 1, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center',
    paddingVertical: 15, borderRadius: 16, borderWidth: 1,
  },
});