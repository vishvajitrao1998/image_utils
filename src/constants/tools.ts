import { Ionicons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';

export const BRAND = { name: 'Pixora', tagline: 'Shrink, resize and convert images beautifully.' };

export type Tool = {
  id: string;
  title: string;
  subtitle: string;
  icon: ComponentProps<typeof Ionicons>['name'];
  route?: string; // undefined = coming soon
};

export const TOOLS: Tool[] = [
  { id: 'compress', title: 'Compress', subtitle: 'Reduce file size', icon: 'contract-outline', route: '/compressor' },
  { id: 'resize', title: 'Resize', subtitle: 'Change dimensions', icon: 'resize-outline' },
  { id: 'convert', title: 'Convert', subtitle: 'JPG, PNG, WebP', icon: 'swap-horizontal-outline' },
  { id: 'crop', title: 'Crop', subtitle: 'Trim to fit', icon: 'crop-outline' },
  { id: 'rotate', title: 'Rotate & Flip', subtitle: 'Fix orientation', icon: 'sync-outline' },
  { id: 'watermark', title: 'Watermark', subtitle: 'Protect your work', icon: 'water-outline' },
];