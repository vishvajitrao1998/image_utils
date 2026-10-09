import { FlipType, ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { tiltGeometry } from '../utils/geometry';
import { getFileSize } from './imageCompressor';

export type TransformOptions = {
  uri: string;
  originalWidth: number;
  originalHeight: number;
  rotation: number; // 0, 90, 180, 270 (clockwise), applied first
  flipH: boolean; // applied after the 90° rotation
  flipV: boolean;
  tilt: number; // fine rotation in degrees, applied last
  autoCrop: boolean; // trim the empty corners created by the tilt
  format: 'jpeg' | 'png';
};

export type TransformResult = { uri: string; width: number; height: number; size: number };

export async function transformImage(o: TransformOptions): Promise<TransformResult> {
  const ctx = ImageManipulator.manipulate(o.uri);

  if (o.rotation % 360 !== 0) ctx.rotate(o.rotation);
  if (o.flipH) ctx.flip(FlipType.Horizontal);
  if (o.flipV) ctx.flip(FlipType.Vertical);

  if (o.tilt !== 0) {
    ctx.rotate(o.tilt);

    if (o.autoCrop) {
      const odd = o.rotation % 180 !== 0;
      const w0 = odd ? o.originalHeight : o.originalWidth;
      const h0 = odd ? o.originalWidth : o.originalHeight;
      const g = tiltGeometry(w0, h0, o.tilt);

      const canvasW = Math.round(g.boundW);
      const canvasH = Math.round(g.boundH);
      // 2px safety margin so rounding differences can never push the crop out of bounds
      const cropW = Math.max(1, Math.floor(g.cropW) - 2);
      const cropH = Math.max(1, Math.floor(g.cropH) - 2);

      ctx.crop({
        originX: Math.max(0, Math.floor((canvasW - cropW) / 2)),
        originY: Math.max(0, Math.floor((canvasH - cropH) / 2)),
        width: cropW,
        height: cropH,
      });
    }
  }

  const rendered = await ctx.renderAsync();
  const saved = await rendered.saveAsync({
    format: o.format === 'png' ? SaveFormat.PNG : SaveFormat.JPEG,
    compress: 0.95,
  });

  const size = await getFileSize(saved.uri);
  return { uri: saved.uri, width: saved.width, height: saved.height, size };
}