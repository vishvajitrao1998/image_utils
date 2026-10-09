import { useMemo, useRef } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { clamp } from '../utils/math';

export type Rect = { x: number; y: number; w: number; h: number };
type Corner = 'tl' | 'tr' | 'bl' | 'br';
type Mode = 'move' | Corner;

export const CROP_PAD = 16; // extra touch room around the image so edge handles stay grabbable
const MIN = 56;
const HANDLE = 44;
const LINE = '#F5F0E8';

type Props = {
  width: number; // displayed image width
  height: number; // displayed image height
  rect: Rect;
  ratio: number | null; // width / height, null = free
  onChange: (r: Rect) => void;
  onGesture: (active: boolean) => void; // lets the parent lock scrolling while dragging
};

export default function CropOverlay({ width: W, height: H, rect, ratio, onChange, onGesture }: Props) {
  const live = useRef({ W, H, rect, ratio, onChange, onGesture });
  live.current = { W, H, rect, ratio, onChange, onGesture };
  const start = useRef<Rect>(rect);

  const responders = useMemo(() => {
    const make = (mode: Mode) =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          start.current = { ...live.current.rect };
          live.current.onGesture(true);
        },
        onPanResponderMove: (_, g) => {
          const { W, H, ratio, onChange } = live.current;
          const s = start.current;

          if (mode === 'move') {
            onChange({ ...s, x: clamp(s.x + g.dx, 0, W - s.w), y: clamp(s.y + g.dy, 0, H - s.h) });
            return;
          }

          // Resize: the opposite corner stays fixed (the anchor)
          const sx = mode.includes('r') ? 1 : -1;
          const sy = mode.includes('b') ? 1 : -1;
          const ax = s.x + (sx > 0 ? 0 : s.w);
          const ay = s.y + (sy > 0 ? 0 : s.h);
          const mx = s.x + (sx > 0 ? s.w : 0) + g.dx;
          const my = s.y + (sy > 0 ? s.h : 0) + g.dy;
          const maxW = sx > 0 ? W - ax : ax;
          const maxH = sy > 0 ? H - ay : ay;

          let w = sx * (mx - ax);
          let h = sy * (my - ay);

          if (ratio) {
            w = Math.max(w, h * ratio);
            w = Math.min(w, maxW, maxH * ratio);
            w = Math.max(w, MIN, MIN * ratio);
            h = w / ratio;
          } else {
            w = clamp(w, MIN, maxW);
            h = clamp(h, MIN, maxH);
          }

          onChange({ x: sx > 0 ? ax : ax - w, y: sy > 0 ? ay : ay - h, w, h });
        },
        onPanResponderRelease: () => live.current.onGesture(false),
        onPanResponderTerminate: () => live.current.onGesture(false),
      });

    return { move: make('move'), tl: make('tl'), tr: make('tr'), bl: make('bl'), br: make('br') };
  }, []);

  const P = CROP_PAD;
  const { x, y, w, h } = rect;
  const dim = 'rgba(0,0,0,0.55)';

  const corner = (c: Corner) => {
    const right = c.includes('r');
    const bottom = c.includes('b');
    return (
      <View
        key={c}
        {...responders[c].panHandlers}
        style={{
          position: 'absolute',
          left: P + x + (right ? w : 0) - HANDLE / 2,
          top: P + y + (bottom ? h : 0) - HANDLE / 2,
          width: HANDLE,
          height: HANDLE,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <View style={styles.dot} />
      </View>
    );
  };

  return (
    <View style={{ width: W + P * 2, height: H + P * 2 }}>
      {/* Dimmed area outside the crop box */}
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View style={{ position: 'absolute', left: P, top: P, width: W, height: y, backgroundColor: dim }} />
        <View style={{ position: 'absolute', left: P, top: P + y + h, width: W, height: H - y - h, backgroundColor: dim }} />
        <View style={{ position: 'absolute', left: P, top: P + y, width: x, height: h, backgroundColor: dim }} />
        <View style={{ position: 'absolute', left: P + x + w, top: P + y, width: W - x - w, height: h, backgroundColor: dim }} />
      </View>

      {/* Crop box: drag to move */}
      <View
        {...responders.move.panHandlers}
        style={{ position: 'absolute', left: P + x, top: P + y, width: w, height: h, borderWidth: 2, borderColor: LINE }}
      >
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <View style={[styles.vLine, { left: '33.33%' }]} />
          <View style={[styles.vLine, { left: '66.66%' }]} />
          <View style={[styles.hLine, { top: '33.33%' }]} />
          <View style={[styles.hLine, { top: '66.66%' }]} />
        </View>
      </View>

      {(['tl', 'tr', 'bl', 'br'] as Corner[]).map(corner)}
    </View>
  );
}

const styles = StyleSheet.create({
  dot: { width: 20, height: 20, borderRadius: 10, backgroundColor: LINE, borderWidth: 3, borderColor: '#17181B' },
  vLine: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(245,240,232,0.45)' },
  hLine: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(245,240,232,0.45)' },
});