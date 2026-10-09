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
export async function pickImage(): Promise<PickedImage | null> {
  const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
  if (res.canceled) return null;
  const a = res.assets[0];
  const size = a.fileSize ?? (await getFileSize(a.uri));
  return { uri: a.uri, width: a.width, height: a.height, size, mimeType: a.mimeType ?? undefined, name: a.fileName ?? undefined };
}

export async function shareImage(uri: string) {
  if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(uri);
}

export async function saveToGallery(uri: string) {
  try {
    const MediaLibrary = await import('expo-media-library/legacy'); // lazy: not available in Expo Go
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