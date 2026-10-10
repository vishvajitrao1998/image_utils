import { SUPPORT_EMAIL } from './app';
import { BRAND } from './tools';

export type LegalSection = { heading: string; body: string };

export const LEGAL_UPDATED = 'October 10, 2026';

export const PRIVACY: LegalSection[] = [
  {
    heading: 'Overview',
    body: `${BRAND.name} is a set of image tools (compress, resize, convert, crop, rotate, watermark, text, merge, grayscale and sketch). Your images are processed on your device. They are not uploaded to any server by this app.`,
  },
  {
    heading: 'Information we collect',
    body: 'We do not collect, store or transmit your photos or any personal information. The app does not require an account or sign-in.',
  },
  {
    heading: 'Photos and permissions',
    body: 'The app asks for access to your photo library so you can choose images, and, only when you tap Save, permission to save the result to your gallery. You can change these permissions at any time in your device settings.',
  },
  {
    heading: 'Temporary files',
    body: 'While you work, the app keeps temporary copies of your images in its private cache. You can remove them at any time from Settings → Clear temporary files.',
  },
  {
    heading: 'Sharing',
    body: 'When you use Share, your image is handed to the app you choose. That app handles it under its own privacy policy.',
  },
  {
    heading: 'Third-party services',
    body: 'The app does not include advertising or analytics services. Fonts used by the text tool are bundled inside the app.',
  },
  {
    heading: "Children's privacy",
    body: 'The app is not directed at children under 13 and does not knowingly collect information from them.',
  },
  {
    heading: 'Changes to this policy',
    body: 'We may update this policy from time to time. The date at the top shows when it was last changed.',
  },
  {
    heading: 'Contact us',
    body: `If you have questions about this policy, email ${SUPPORT_EMAIL}.`,
  },
];

export const DISCLAIMER: LegalSection[] = [
  {
    heading: 'General',
    body: `${BRAND.name} is provided "as is" and "as available", without warranties of any kind, express or implied.`,
  },
  {
    heading: 'Image quality and results',
    body: 'Compressing, resizing, converting, cropping and applying effects can reduce image quality or change file contents. Results may differ between devices. Always keep a copy of your original images.',
  },
  {
    heading: 'Your content and rights',
    body: 'You are responsible for having the right to edit, modify and share the images you use. Watermarks and text overlays are visual marks only and do not provide legal protection for your work. Do not use the app for unlawful purposes.',
  },
  {
    heading: 'Saving and sharing',
    body: 'Edited images are saved or shared only when you choose to do so. Make sure your device has enough free storage.',
  },
  {
    heading: 'Device performance',
    body: 'Very large images may be slow to process, or may fail on devices with limited memory. The app may reduce the size of very large images to keep working reliably.',
  },
  {
    heading: 'Limitation of liability',
    body: 'To the fullest extent permitted by law, the developer is not liable for any loss of data, loss of image quality, or other damages arising from the use of, or inability to use, this app.',
  },
  {
    heading: 'Contact us',
    body: `For questions about this disclaimer, email ${SUPPORT_EMAIL}.`,
  },
];