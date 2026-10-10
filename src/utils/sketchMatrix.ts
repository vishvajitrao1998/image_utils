export type SketchStyle = 'pencil' | 'color' | 'ink';
export type Paper = 'white' | 'cream' | 'cool';

export type SketchParams = {
  style: SketchStyle;
  thickness: number; // 1–10, bigger = thicker, softer lines
  darkness: number; // 0.5–3, bigger = darker lines
  paper: Paper;
  chalk: boolean; // white lines on a dark background
};

export const PAPER_TINT: Record<Paper, [number, number, number]> = {
  white: [1, 1, 1],
  cream: [1, 0.97, 0.9],
  cool: [0.92, 0.96, 1],
};

const IDENTITY = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];
const GRAY = [0.299, 0.587, 0.114];

// Blur size as a fraction of the image width (so the preview and the export match)
export const sketchSigmaFraction = (thickness: number) => (0.2 + (thickness - 1) * 0.31) / 100;

export function buildSketchMatrices(p: SketchParams) {
  // 1) Base layer: gray image (or the original colors for the colored sketch)
  const base =
    p.style === 'color'
      ? IDENTITY
      : [...GRAY, 0, 0, ...GRAY, 0, 0, ...GRAY, 0, 0, 0, 0, 0, 1, 0];

  // 2) Layer that gets blurred and blended on top: the inverted gray image
  const inv = GRAY.map((w) => -w);
  const dodge = [...inv, 0, 1, ...inv, 0, 1, ...inv, 0, 1, 0, 0, 0, 1, 0];

  // 3) Final adjustment: darkness (pivot at white so the paper stays white), paper tint, chalk
  const s = p.darkness * (p.style === 'ink' ? 4 : 1);
  const o = 1 - s;
  let final: number[];
  if (p.chalk) {
    final = [-s, 0, 0, 0, s, 0, -s, 0, 0, s, 0, 0, -s, 0, s, 0, 0, 0, 1, 0];
  } else {
    const [tr, tg, tb] = PAPER_TINT[p.paper];
    final = [s * tr, 0, 0, 0, o * tr, 0, s * tg, 0, 0, o * tg, 0, 0, s * tb, 0, o * tb, 0, 0, 0, 1, 0];
  }

  return { base, dodge, final };
}