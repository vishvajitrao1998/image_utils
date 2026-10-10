import { Directory, File, Paths } from 'expo-file-system';

function sizeOf(item: File | Directory): number {
  if (item instanceof File) return item.size ?? 0;
  try {
    return item.list().reduce((sum, child) => sum + sizeOf(child), 0);
  } catch {
    return 0;
  }
}

export function getCacheSize(): number {
  try {
    return Paths.cache.list().reduce((sum, item) => sum + sizeOf(item), 0);
  } catch {
    return 0;
  }
}

export function clearCache(): void {
  try {
    for (const item of Paths.cache.list()) {
      try {
        item.delete();
      } catch {
        // skip files that are in use
      }
    }
  } catch {
    // nothing to clear
  }
}