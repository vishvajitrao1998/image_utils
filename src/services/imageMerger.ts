import { ClipOp, FilterMode, ImageFormat, MipmapMode, Skia } from '@shopify/react-native-skia';
import { File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import type { MergeLayout } from '../utils/mergeLayout';
import { getFileSize } from './imageCompressor';

export type MergeResult = { uri: string; width: number; height: number; size: number };

const MAX_INPUT_SIDE = 4096;

// Applies EXIF rotation, converts formats like HEIC, and caps very large photos
export async function prepareImage(img: { uri: string; width: number; height: number }, png: boolean) {
  const ctx = ImageManipulator.manipulate(img.uri);
  const longest = Math.max(img.width, img.height);
  if (longest > MAX_INPUT_SIDE) {
    ctx.resize(img.width >= img.height ? { width: MAX_INPUT_SIDE } : { height: MAX_INPUT_SIDE });
  }
  const rendered = await ctx.renderAsync();
  const saved = await rendered.saveAsync({ format: png ? SaveFormat.PNG : SaveFormat.JPEG, compress: 0.95 });
  return { uri: saved.uri, width: saved.width, height: saved.height };
}

export async function exportMerge(opts: {
  uris: string[];
  layout: MergeLayout;
  bgColor: string | null; // null = transparent
  radiusPct: number; // 0–50, % of each image's shorter side
  format: 'jpeg' | 'png';
  maxSide: number;
}): Promise<MergeResult> {
  const { layout } = opts;
  const f = Math.min(1, opts.maxSide / Math.max(layout.width, layout.height));
  const W = Math.max(1, Math.round(layout.width * f));
  const H = Math.max(1, Math.round(layout.height * f));

  const surface = Skia.Surface.MakeOffscreen(W, H);
  if (!surface) throw new Error('Could not create a drawing surface for this size.');
  const canvas = surface.getCanvas();

  if (opts.bgColor) canvas.drawColor(Skia.Color(opts.bgColor));

  const paint = Skia.Paint();
  paint.setAntiAlias(true);

  for (let i = 0; i < opts.uris.length; i++) {
    const r = layout.rects[i];
    const data = await Skia.Data.fromURI(opts.uris[i]);
    const image = Skia.Image.MakeImageFromEncoded(data);
    if (!image) throw new Error(`Could not read image ${i + 1}.`);

    const dest = Skia.XYWHRect(r.x * f, r.y * f, r.w * f, r.h * f);
    const src = Skia.XYWHRect(r.sx, r.sy, r.sw, r.sh);

    canvas.save();
    if (opts.radiusPct > 0) {
      const rad = (Math.min(r.w, r.h) * f * opts.radiusPct) / 100;
      canvas.clipRRect(Skia.RRectXY(dest, rad, rad), ClipOp.Intersect, true);
    }
    canvas.drawImageRectOptions(image, src, dest, FilterMode.Linear, MipmapMode.Linear, paint);
    canvas.restore();

    (image as any).dispose?.(); // free memory before decoding the next one
  }

  surface.flush();
  const bytes = surface
    .makeImageSnapshot()
    .encodeToBytes(opts.format === 'png' ? ImageFormat.PNG : ImageFormat.JPEG, 95);

  const out = new File(Paths.cache, `merged-${Date.now()}.${opts.format === 'png' ? 'png' : 'jpg'}`);
  out.create();
  out.write(bytes);

  return { uri: out.uri, width: W, height: H, size: await getFileSize(out.uri) };
}