import * as ImagePicker from 'expo-image-picker';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { getFileSize } from './imageCompressor';

export type PickedImage = {
  uri: string;
  width: number;
  height: number;
  size: number;
  mimeType?: string;
  name?: string;
};

type Asset = ImagePicker.ImagePickerAsset;

async function toPicked(a: Asset): Promise<PickedImage> {
  return {
    uri: a.uri,
    width: a.width,
    height: a.height,
    size: a.fileSize ?? (await getFileSize(a.uri)),
    mimeType: a.mimeType ?? undefined,
    name: a.fileName ?? undefined,
  };
}

// Single image (used by most tools)
export async function pickImage(): Promise<PickedImage | null> {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  if (res.canceled) return null;
  return toPicked(res.assets[0]);
}

// Several images (used by Merge)
export async function pickImages(limit = 20): Promise<PickedImage[]> {
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    orderedSelection: true,
    selectionLimit: limit,
    quality: 1,
  });
  if (res.canceled) return [];
  return Promise.all(res.assets.map(toPicked));
}

export async function shareImage(uri: string) {
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
}

export async function saveToGallery(uri: string) {
  try {
    const MediaLibrary = require('expo-media-library/legacy'); // lazy: not available in Expo Go
    const perm = await MediaLibrary.requestPermissionsAsync(true);
    if (!perm.granted) {
      Alert.alert('Permission needed', 'Allow access to save images to your gallery.');
      return;
    }
    await MediaLibrary.saveToLibraryAsync(uri);
    Alert.alert('Saved', 'The image was saved to your gallery.');
  } catch {
    Alert.alert(
      'Gallery saving unavailable',
      'This build cannot save to the gallery directly. Choose "Save image" from the share sheet instead.',
      [{ text: 'Open share sheet', onPress: () => shareImage(uri) }, { text: 'Cancel', style: 'cancel' }]
    );
  }
}