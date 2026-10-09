export type ResizePreset = { id: string; label: string; w: number; h: number };

export const RESIZE_PRESETS: ResizePreset[] = [
  { id: 'ig-post', label: 'Instagram Post', w: 1080, h: 1080 },
  { id: 'ig-portrait', label: 'Instagram Portrait', w: 1080, h: 1350 },
  { id: 'story', label: 'Story / Reel', w: 1080, h: 1920 },
  { id: 'yt-thumb', label: 'YouTube Thumbnail', w: 1280, h: 720 },
  { id: 'x-post', label: 'X / Twitter Post', w: 1600, h: 900 },
  { id: 'fb-cover', label: 'Facebook Cover', w: 820, h: 312 },
  { id: 'hd', label: 'Full HD', w: 1920, h: 1080 },
  { id: 'avatar', label: 'Profile Photo', w: 400, h: 400 },
];