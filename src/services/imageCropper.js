import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { getFileSize } from './imageCompressor';

export type CropOptions = {
  uri: string;
  originX: number;
  originY: number;
  width: number;
  height: number;
  format: 'jpeg' | 'png';
};

export type CropResult = { uri: string; width: number; height: number; size: number };

export async function cropImage(o: CropOptions): Promise<CropResult> {
  const ctx = ImageManipulator.manipulate(o.uri);
  ctx.crop({ originX: o.originX, originY: o.originY, width: o.width, height: o.height });

  const rendered = await ctx.renderAsync();
  const saved = await rendered.saveAsync({
    format: o.format === 'png' ? SaveFormat.PNG : SaveFormat.JPEG,
    compress: 0.95,
  });

  const size = await getFileSize(saved.uri);
  return { uri: saved.uri, width: saved.width, height: saved.height, size };
}