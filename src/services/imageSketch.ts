import { BlendMode, ImageFormat, Skia, TileMode } from '@shopify/react-native-skia';
import { File, Paths } from 'expo-file-system';
import { buildSketchMatrices, SketchParams, sketchSigmaFraction } from '../utils/sketchMatrix';
import { getFileSize } from './imageCompressor';

export type SketchResult = { uri: string; width: number; height: number; size: number };

export async function exportSketch(opts: {
  uri: string;
  params: SketchParams;
  format: 'jpeg' | 'png';
}): Promise<SketchResult> {
  const data = await Skia.Data.fromURI(opts.uri);
  const image = Skia.Image.MakeImageFromEncoded(data);
  if (!image) throw new Error('Could not decode this image.');

  const width = image.width();
  const height = image.height();
  const m = buildSketchMatrices(opts.params);
  const sigma = Math.max(0.5, sketchSigmaFraction(opts.params.thickness) * width);

  const surface = Skia.Surface.MakeOffscreen(width, height);
  if (!surface) throw new Error('Could not create a drawing surface for this image size.');
  const canvas = surface.getCanvas();

  // Everything drawn inside this layer gets the final color adjustment
  const layerPaint = Skia.Paint();
  layerPaint.setColorFilter(Skia.ColorFilter.MakeMatrix(m.final));
  canvas.saveLayer(layerPaint);

  // Base image
  const basePaint = Skia.Paint();
  basePaint.setColorFilter(Skia.ColorFilter.MakeMatrix(m.base));
  canvas.drawImage(image, 0, 0, basePaint);

  // Inverted + blurred copy, blended with "color dodge"
  const dodgePaint = Skia.Paint();
  dodgePaint.setColorFilter(Skia.ColorFilter.MakeMatrix(m.dodge));
  dodgePaint.setImageFilter(Skia.ImageFilter.MakeBlur(sigma, sigma, TileMode.Clamp, null));
  dodgePaint.setBlendMode(BlendMode.ColorDodge);
  canvas.drawImage(image, 0, 0, dodgePaint);

  canvas.restore();
  surface.flush();

  const bytes = surface
    .makeImageSnapshot()
    .encodeToBytes(opts.format === 'png' ? ImageFormat.PNG : ImageFormat.JPEG, 95);

  const out = new File(Paths.cache, `sketch-${Date.now()}.${opts.format === 'png' ? 'png' : 'jpg'}`);
  out.create();
  out.write(bytes);

  return { uri: out.uri, width, height, size: await getFileSize(out.uri) };
}