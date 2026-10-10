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
  { id: 'compress', title: 'Image Compressor', subtitle: 'Compresse your Image size', icon: 'contract-outline', route: '/compressor' },
  { id: 'resize', title: 'Image Resizer', subtitle: 'Change dimensions', icon: 'resize-outline', route: '/resize' },
  { id: 'convert', title: 'Image Convertor', subtitle: 'JPG, PNG, WebP, BMP', icon: 'swap-horizontal-outline', route: '/convert' },
  { id: 'crop', title: 'Crop Your Images', subtitle: 'Crop your Images within seconds', icon: 'crop-outline', route: '/crop' },
  { id: 'rotate', title: 'Rotate & Flip Images', subtitle: 'Rotate and Flip Your Images', icon: 'sync-outline', route: '/rotate' },
  { id: 'watermark', title: 'Watermark on Image', subtitle: 'Add watermark on your Image', icon: 'water-outline', route: '/watermark' },
  { id: 'grayscale', title: 'Image to Grayscale', subtitle: 'Convert Your Images to Black & white', icon: 'contrast-outline', route: '/grayscale' },
  { id: 'text', title: 'Add Text on Image', subtitle: 'Add Stylish text on your Images', icon: 'text-outline', route: '/addtext' },
  { id: 'merge', title: 'Images Merger', subtitle: 'Combine Multiple Images in Single Image', icon: 'albums-outline', route: '/merge' },
  { id: 'sketch', title: 'Image Sketch', subtitle: 'Pencil & ink art', icon: 'brush-outline', route: '/sketch' },
];