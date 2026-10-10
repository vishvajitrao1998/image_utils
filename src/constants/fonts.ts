import { Anton_400Regular } from '@expo-google-fonts/anton';
import { DancingScript_400Regular, DancingScript_700Bold } from '@expo-google-fonts/dancing-script';
import { Lobster_400Regular } from '@expo-google-fonts/lobster';
import { Oswald_400Regular, Oswald_700Bold } from '@expo-google-fonts/oswald';
import { Pacifico_400Regular } from '@expo-google-fonts/pacifico';
import { PermanentMarker_400Regular } from '@expo-google-fonts/permanent-marker';
import {
    PlayfairDisplay_400Regular,
    PlayfairDisplay_400Regular_Italic,
    PlayfairDisplay_700Bold,
    PlayfairDisplay_700Bold_Italic,
} from '@expo-google-fonts/playfair-display';
import { Poppins_400Regular, Poppins_400Regular_Italic, Poppins_700Bold, Poppins_700Bold_Italic } from '@expo-google-fonts/poppins';
import { Platform, TextStyle } from 'react-native';

// Pass this to useFonts() once, on the screen that uses text
export const FONT_ASSETS = {
  Poppins_400Regular, Poppins_700Bold, Poppins_400Regular_Italic, Poppins_700Bold_Italic,
  PlayfairDisplay_400Regular, PlayfairDisplay_700Bold,
  PlayfairDisplay_400Regular_Italic, PlayfairDisplay_700Bold_Italic,
  Oswald_400Regular, Oswald_700Bold,
  Anton_400Regular, Pacifico_400Regular, Lobster_400Regular,
  DancingScript_400Regular, DancingScript_700Bold,
  PermanentMarker_400Regular,
};

export type FontDef = {
  key: string;
  label: string;
  system?: 'sans' | 'serif' | 'mono';
  family?: { regular: string; bold?: string; italic?: string; boldItalic?: string };
};

export const FONTS: FontDef[] = [
  { key: 'sans', label: 'Sans', system: 'sans' },
  { key: 'serif', label: 'Serif', system: 'serif' },
  { key: 'mono', label: 'Mono', system: 'mono' },
  {
    key: 'poppins', label: 'Poppins',
    family: { regular: 'Poppins_400Regular', bold: 'Poppins_700Bold', italic: 'Poppins_400Regular_Italic', boldItalic: 'Poppins_700Bold_Italic' },
  },
  {
    key: 'playfair', label: 'Playfair',
    family: {
      regular: 'PlayfairDisplay_400Regular', bold: 'PlayfairDisplay_700Bold',
      italic: 'PlayfairDisplay_400Regular_Italic', boldItalic: 'PlayfairDisplay_700Bold_Italic',
    },
  },
  { key: 'oswald', label: 'Oswald', family: { regular: 'Oswald_400Regular', bold: 'Oswald_700Bold' } },
  { key: 'anton', label: 'Anton', family: { regular: 'Anton_400Regular' } },
  { key: 'pacifico', label: 'Pacifico', family: { regular: 'Pacifico_400Regular' } },
  { key: 'lobster', label: 'Lobster', family: { regular: 'Lobster_400Regular' } },
  { key: 'dancing', label: 'Dancing Script', family: { regular: 'DancingScript_400Regular', bold: 'DancingScript_700Bold' } },
  { key: 'marker', label: 'Marker', family: { regular: 'PermanentMarker_400Regular' } },
];

const SYSTEM_FAMILY = Platform.select({
  android: { sans: 'sans-serif', serif: 'serif', mono: 'monospace' },
  default: { sans: 'System', serif: 'Georgia', mono: 'Menlo' },
})!;

// Bold / italic are only available where the font actually has that variant
export const canBold = (d: FontDef) => !!d.system || !!d.family?.bold;
export const canItalic = (d: FontDef) => !!d.system || !!d.family?.italic;

export function resolveFont(def: FontDef, bold: boolean, italic: boolean): TextStyle {
  if (def.system) {
    return {
      fontFamily: SYSTEM_FAMILY[def.system],
      fontWeight: bold ? '700' : '400',
      fontStyle: italic ? 'italic' : 'normal',
    };
  }
  const f = def.family!;
  let family = f.regular;
  if (bold && italic && f.boldItalic) family = f.boldItalic;
  else if (bold && f.bold) family = f.bold;
  else if (italic && f.italic) family = f.italic;
  return { fontFamily: family };
}