export type MergeMode = 'vertical' | 'horizontal' | 'grid';

export type MergeSettings = {
  mode: MergeMode;
  columns: number;
  cellAspect: number | null; // width / height of a grid cell, null = average of the images
  fit: 'fill' | 'fit'; // grid only: crop to fill the cell, or fit the whole image inside it
  spacing: number; // gap between images, % of the reference size
  padding: number; // outer margin, % of the reference size
};

export type Size = { width: number; height: number };

export type PlacedRect = {
  x: number; y: number; w: number; h: number; // where it goes on the canvas
  sx: number; sy: number; sw: number; sh: number; // which part of the source image is used
};

export type MergeLayout = { width: number; height: number; rects: PlacedRect[] };

export function computeLayout(sizes: Size[], s: MergeSettings): MergeLayout {
  const n = sizes.length;
  if (n === 0) return { width: 1, height: 1, rects: [] };

  /* ---------- Vertical: all images get the same width ---------- */
  if (s.mode === 'vertical') {
    const refW = Math.max(...sizes.map((i) => i.width));
    const gap = (refW * s.spacing) / 100;
    const pad = (refW * s.padding) / 100;
    let y = pad;
    const rects = sizes.map((sz) => {
      const h = (refW * sz.height) / sz.width;
      const r = { x: pad, y, w: refW, h, sx: 0, sy: 0, sw: sz.width, sh: sz.height };
      y += h + gap;
      return r;
    });
    return { width: refW + pad * 2, height: y - gap + pad, rects };
  }

  /* ---------- Horizontal: all images get the same height ---------- */
  if (s.mode === 'horizontal') {
    const refH = Math.max(...sizes.map((i) => i.height));
    const gap = (refH * s.spacing) / 100;
    const pad = (refH * s.padding) / 100;
    let x = pad;
    const rects = sizes.map((sz) => {
      const w = (refH * sz.width) / sz.height;
      const r = { x, y: pad, w, h: refH, sx: 0, sy: 0, sw: sz.width, sh: sz.height };
      x += w + gap;
      return r;
    });
    return { width: x - gap + pad, height: refH + pad * 2, rects };
  }

  /* ---------- Grid ---------- */
  const cols = Math.max(1, Math.min(s.columns, n));
  const rows = Math.ceil(n / cols);
  const cellW = Math.max(...sizes.map((i) => i.width));
  const avgInvAspect = sizes.reduce((sum, i) => sum + i.height / i.width, 0) / n;
  const cellH = s.cellAspect ? cellW / s.cellAspect : cellW * avgInvAspect;
  const gap = (cellW * s.spacing) / 100;
  const pad = (cellW * s.padding) / 100;

  const rects = sizes.map((sz, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const inRow = row === rows - 1 ? n - row * cols : cols;
    const offsetX = ((cols - inRow) * (cellW + gap)) / 2; // centers an incomplete last row
    const cellX = pad + offsetX + col * (cellW + gap);
    const cellY = pad + row * (cellH + gap);

    if (s.fit === 'fill') {
      const scale = Math.max(cellW / sz.width, cellH / sz.height);
      const sw = cellW / scale;
      const sh = cellH / scale;
      return { x: cellX, y: cellY, w: cellW, h: cellH, sx: (sz.width - sw) / 2, sy: (sz.height - sh) / 2, sw, sh };
    }

    const scale = Math.min(cellW / sz.width, cellH / sz.height);
    const w = sz.width * scale;
    const h = sz.height * scale;
    return {
      x: cellX + (cellW - w) / 2, y: cellY + (cellH - h) / 2, w, h,
      sx: 0, sy: 0, sw: sz.width, sh: sz.height,
    };
  });

  return {
    width: cols * cellW + (cols - 1) * gap + pad * 2,
    height: rows * cellH + (rows - 1) * gap + pad * 2,
    rects,
  };
}