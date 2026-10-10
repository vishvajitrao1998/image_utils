import { ImageFormat, Skia } from '@shopify/react-native-skia';
import { File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { getFileSize } from './imageCompressor';

export type GrayResult = { uri: string; width: number; height: number; size: number };

// Applies EXIF rotation and converts formats like HEIC/WebP into something the drawing engine can decode
export async function normalizeImage(uri: string, png: boolean) {
  const rendered = await ImageManipulator.manipulate(uri).renderAsync();
  const saved = await rendered.saveAsync({
    format: png ? SaveFormat.PNG : SaveFormat.JPEG,
    compress: 1,
  });
  return { uri: saved.uri, width: saved.width, height: saved.height };
}

// Draws the full-resolution image through the color matrix and saves it to a file
export async function exportGrayscale(opts: {
  uri: string;
  matrix: number[];
  format: 'jpeg' | 'png';
}): Promise<GrayResult> {
  const data = await Skia.Data.fromURI(opts.uri);
  const image = Skia.Image.MakeImageFromEncoded(data);
  if (!image) throw new Error('Could not decode this image.');

  const width = image.width();
  const height = image.height();

  const surface = Skia.Surface.MakeOffscreen(width, height);
  if (!surface) throw new Error('Could not create a drawing surface for this image size.');

  const paint = Skia.Paint();
  paint.setColorFilter(Skia.ColorFilter.MakeMatrix(opts.matrix));
  surface.getCanvas().drawImage(image, 0, 0, paint);
  surface.flush();

  const bytes = surface
    .makeImageSnapshot()
    .encodeToBytes(opts.format === 'png' ? ImageFormat.PNG : ImageFormat.JPEG, 95);

  const ext = opts.format === 'png' ? 'png' : 'jpg';
  const out = new File(Paths.cache, `gray-${Date.now()}.${ext}`);
  out.create();
  out.write(bytes);

  return { uri: out.uri, width, height, size: await getFileSize(out.uri) };
}