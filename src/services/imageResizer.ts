import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { getFileSize } from './imageCompressor';

export type ResizeFormat = 'jpeg' | 'png' | 'webp';
export type FitMode = 'stretch' | 'cover'; // cover = fill the box and crop the overflow from the center

export type ResizeOptions = {
  uri: string;
  originalWidth: number;
  originalHeight: number;
  targetWidth: number;
  targetHeight: number;
  fit: FitMode;
  format: ResizeFormat;
  quality: number; // ignored for PNG
};

export type ResizeResult = { uri: string; width: number; height: number; size: number };

const FORMATS = { jpeg: SaveFormat.JPEG, png: SaveFormat.PNG, webp: SaveFormat.WEBP };

export async function resizeImage(o: ResizeOptions): Promise<ResizeResult> {
  const ctx = ImageManipulator.manipulate(o.uri);

  if (o.fit === 'cover') {
    const scale = Math.max(o.targetWidth / o.originalWidth, o.targetHeight / o.originalHeight);
    const sw = Math.ceil(o.originalWidth * scale);
    const sh = Math.ceil(o.originalHeight * scale);
    ctx.resize({ width: sw, height: sh });
    ctx.crop({
      originX: Math.floor((sw - o.targetWidth) / 2),
      originY: Math.floor((sh - o.targetHeight) / 2),
      width: o.targetWidth,
      height: o.targetHeight,
    });
  } else {
    ctx.resize({ width: o.targetWidth, height: o.targetHeight });
  }

  const rendered = await ctx.renderAsync();
  const saved = await rendered.saveAsync({ compress: o.quality, format: FORMATS[o.format] });
  const size = await getFileSize(saved.uri);
  return { uri: saved.uri, width: saved.width, height: saved.height, size };
}