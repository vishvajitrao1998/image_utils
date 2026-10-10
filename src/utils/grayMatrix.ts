export type GrayMethod = 'natural' | 'classic' | 'average' | 'red' | 'green' | 'blue';

export const GRAY_METHODS: { id: GrayMethod; label: string; weights: [number, number, number] }[] = [
  { id: 'natural', label: 'Natural', weights: [0.2126, 0.7152, 0.0722] },
  { id: 'classic', label: 'Classic', weights: [0.299, 0.587, 0.114] },
  { id: 'average', label: 'Average', weights: [1 / 3, 1 / 3, 1 / 3] },
  { id: 'red', label: 'Red filter', weights: [1, 0, 0] },
  { id: 'green', label: 'Green filter', weights: [0, 1, 0] },
  { id: 'blue', label: 'Blue filter', weights: [0, 0, 1] },
];

// Builds a 4×5 color matrix (20 numbers, row-major) for Skia's color filter.
//  amount: 0 = original colors, 1 = fully gray
//  contrast: 1 = unchanged;  brightness: 0 = unchanged (range about -0.3 to 0.3)
export function buildGrayMatrix(
  weights: [number, number, number],
  amount: number,
  contrast: number,
  brightness: number
): number[] {
  const identity = [
    [1, 0, 0],
    [0, 1, 0],
    [0, 0, 1],
  ];
  const offset = 0.5 - 0.5 * contrast + brightness;

  const rows = identity.map((idRow) => {
    const mixed = idRow.map((v, j) => (1 - amount) * v + amount * weights[j]);
    return [mixed[0] * contrast, mixed[1] * contrast, mixed[2] * contrast, 0, offset];
  });

  return [...rows[0], ...rows[1], ...rows[2], 0, 0, 0, 1, 0];
}