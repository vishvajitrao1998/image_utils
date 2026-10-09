// For an image of w0 × h0 tilted by tiltDeg (0–90°):
//  - bound: the size of the canvas needed to hold the rotated image
//  - crop:  the largest same-shaped rectangle that fits inside it with no empty corners
export function tiltGeometry(w0: number, h0: number, tiltDeg: number) {
  const t = (Math.abs(tiltDeg) * Math.PI) / 180;
  const cos = Math.cos(t);
  const sin = Math.sin(t);

  const boundW = w0 * cos + h0 * sin;
  const boundH = w0 * sin + h0 * cos;
  const s = Math.min(w0 / boundW, h0 / boundH);

  return { boundW, boundH, cropW: s * w0, cropH: s * h0 };
}