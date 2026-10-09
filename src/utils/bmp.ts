export function encodeBmp(rgba: Uint8Array, width: number, height: number): Uint8Array {
  const rowSize = Math.ceil((width * 3) / 4) * 4; // rows are padded to 4 bytes
  const pixelBytes = rowSize * height;
  const fileSize = 54 + pixelBytes;

  const buf = new Uint8Array(fileSize);
  const view = new DataView(buf.buffer);

  // File header
  buf[0] = 0x42; // 'B'
  buf[1] = 0x4d; // 'M'
  view.setUint32(2, fileSize, true);
  view.setUint32(10, 54, true); // pixel data offset

  // Info header
  view.setUint32(14, 40, true);
  view.setInt32(18, width, true);
  view.setInt32(22, height, true);
  view.setUint16(26, 1, true); // planes
  view.setUint16(28, 24, true); // bits per pixel
  view.setUint32(34, pixelBytes, true);
  view.setInt32(38, 2835, true); // ~72 DPI
  view.setInt32(42, 2835, true);

  // Pixels are stored bottom-to-top in BGR order
  let rowStart = 54;
  for (let y = height - 1; y >= 0; y--) {
    let p = rowStart;
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      const a = rgba[i + 3] / 255;
      buf[p++] = Math.round(rgba[i + 2] * a + 255 * (1 - a)); // B
      buf[p++] = Math.round(rgba[i + 1] * a + 255 * (1 - a)); // G
      buf[p++] = Math.round(rgba[i] * a + 255 * (1 - a)); // R
    }
    rowStart += rowSize;
  }
  return buf;
}