import { File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import UPNG from 'upng-js';
import { encodeBmp } from '../utils/bmp';
import { getFileSize } from './imageCompressor';

export type TargetFormat = 'jpg' | 'png' | 'webp' | 'bmp';
export type ConvertResult = { uri: string; width: number; height: number; size: number };

const FIXED_QUALITY = 0.95; // JPG / WebP use a fixed high quality, no user setting

export async function convertImage(uri: string, target: TargetFormat): Promise<ConvertResult> {
  const rendered = await ImageManipulator.manipulate(uri).renderAsync();

  if (target === 'bmp') {
    // 1) normalise to PNG (handles HEIC, WebP, rotation...), 2) decode pixels, 3) encode BMP
    const png = await rendered.saveAsync({ format: SaveFormat.PNG });
    const bytes = await new File(png.uri).bytes();
    const buffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;

    const img = UPNG.decode(buffer);
    const rgba = new Uint8Array(UPNG.toRGBA8(img)[0]);
    const bmp = encodeBmp(rgba, img.width, img.height);

    const out = new File(Paths.cache, `converted-${Date.now()}.bmp`);
    out.create();
    out.write(bmp);
    return { uri: out.uri, width: img.width, height: img.height, size: bmp.length };
  }

  const format = target === 'jpg' ? SaveFormat.JPEG : target === 'webp' ? SaveFormat.WEBP : SaveFormat.PNG;
  const saved = await rendered.saveAsync({ format, compress: FIXED_QUALITY });
  const size = await getFileSize(saved.uri);
  return { uri: saved.uri, width: saved.width, height: saved.height, size };
}