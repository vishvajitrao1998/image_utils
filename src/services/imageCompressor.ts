import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

export type OutputFormat = 'jpeg' | 'webp';

export type CompressOptions = {
  uri: string;
  originalWidth: number;
  quality: number; // 0.1 – 1
  maxWidth: number | null; // null = keep original size
  format: OutputFormat;
};

export type CompressResult = { uri: string; width: number; height: number; size: number };

export async function getFileSize(uri: string): Promise<number> {
  return new File(uri).size;
}

export async function compressImage(opts: CompressOptions): Promise<CompressResult> {
  const ctx = ImageManipulator.manipulate(opts.uri);

  if (opts.maxWidth && opts.originalWidth > opts.maxWidth) {
    ctx.resize({ width: opts.maxWidth });
  }

  const rendered = await ctx.renderAsync();
  const saved = await rendered.saveAsync({
    compress: opts.quality,
    format: opts.format === 'webp' ? SaveFormat.WEBP : SaveFormat.JPEG,
  });

  const size = await getFileSize(saved.uri);
  return { uri: saved.uri, width: saved.width, height: saved.height, size };
}