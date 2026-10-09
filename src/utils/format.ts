export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  return `${(kb / 1024).toFixed(2)} MB`;
}


const FORMAT_LABELS: Record<string, string> = {
  jpeg: 'JPG', jpg: 'JPG', png: 'PNG', webp: 'WebP',
  bmp: 'BMP', 'x-ms-bmp': 'BMP', heic: 'HEIC', heif: 'HEIC', gif: 'GIF',
};

export function getImageFormat(img: { uri: string; mimeType?: string; name?: string }): string {
  const fromMime = img.mimeType?.split('/')[1]?.toLowerCase();
  const fromName = (img.name ?? img.uri).split('?')[0].split('.').pop()?.toLowerCase();
  const raw = fromMime ?? fromName ?? 'image';
  return FORMAT_LABELS[raw] ?? raw.toUpperCase();
}