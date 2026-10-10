import { useEffect, useMemo, useRef, useState } from 'react';
import { Image, LayoutChangeEvent, PanResponder, StyleSheet, Text, View } from 'react-native';
import { isLight } from '../utils/color';
import { clamp } from '../utils/math';

export type WatermarkConfig = {
  kind: 'text' | 'logo';
  text: string;
  color: string;
  logoUri: string | null;
  logoAspect: number; // logo width / height
  sizePct: number; // % of image width (font size for text, logo width for logos)
  opacity: number; // 0–1
  rotation: number; // degrees
  px: number; // horizontal position: 0 = left edge, 0.5 = center, 1 = right edge
  py: number; // vertical position: 0 = top edge, 0.5 = center, 1 = bottom edge
  tile: boolean;
};

export const hasWatermark = (c: WatermarkConfig) =>
  c.kind === 'text' ? c.text.trim().length > 0 : !!c.logoUri;

type Props = {
  width: number;
  height: number;
  config: WatermarkConfig;
  draggable?: boolean; // preview only
  showHandles?: boolean; // dashed outline, preview only
  onMove?: (px: number, py: number) => void;
  onDragState?: (active: boolean) => void;
  onReady?: () => void; // called once the watermark has been laid out (used by the export)
};

export default function WatermarkLayer({
  width, height, config, draggable, showHandles, onMove, onDragState, onReady,
}: Props) {
  const { kind, text, color, logoUri, logoAspect, sizePct, opacity, rotation, px, py, tile } = config;

  const [box, setBox] = useState({ w: 0, h: 0 });
  const readyCalled = useRef(false);

  const margin = width * 0.04;
  const travelX = Math.max(0, width - box.w - margin * 2);
  const travelY = Math.max(0, height - box.h - margin * 2);

  // Latest values for the gesture handlers
  const live = useRef({ px, py, travelX, travelY, draggable, onMove, onDragState });
  live.current = { px, py, travelX, travelY, draggable, onMove, onDragState };
  const start = useRef({ px: 0, py: 0 });

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => !!live.current.draggable,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          start.current = { px: live.current.px, py: live.current.py };
          live.current.onDragState?.(true);
        },
        onPanResponderMove: (_, g) => {
          const { travelX, travelY, onMove } = live.current;
          const nx = travelX > 1 ? clamp(start.current.px + g.dx / travelX, 0, 1) : 0.5;
          const ny = travelY > 1 ? clamp(start.current.py + g.dy / travelY, 0, 1) : 0.5;
          onMove?.(nx, ny);
        },
        onPanResponderRelease: () => live.current.onDragState?.(false),
        onPanResponderTerminate: () => live.current.onDragState?.(false),
      }),
    []
  );

  const content = hasWatermark(config);

  useEffect(() => {
    if (tile && content && !readyCalled.current) {
      readyCalled.current = true;
      onReady?.();
    }
  }, [tile, content]);

  if (!content) return null;

  const base = (sizePct / 100) * width;
  const fontSize = base;
  const logoW = base;
  const logoH = base / (logoAspect || 1);

  const shadow = isLight(color)
    ? {
        textShadowColor: 'rgba(0,0,0,0.35)',
        textShadowOffset: { width: 0, height: width * 0.002 },
        textShadowRadius: width * 0.006,
      }
    : {};

  const renderItem = () =>
    kind === 'text' ? (
      <Text style={[{ fontSize, color, fontWeight: '700' }, shadow]}>{text}</Text>
    ) : (
      <Image source={{ uri: logoUri! }} style={{ width: logoW, height: logoH }} resizeMode="contain" />
    );

  /* ---------- Tiled pattern ---------- */
  if (tile) {
    const gap = kind === 'text' ? fontSize * 1.2 : logoW * 0.5;
    const itemW = (kind === 'text' ? fontSize * 0.7 * text.length : logoW) + gap;
    const itemH = (kind === 'text' ? fontSize * 1.25 : logoH) + gap;
    const inner = Math.hypot(width, height) * 1.1; // large enough to cover the corners after rotating
    const cols = Math.ceil(inner / itemW) + 1;
    const rows = Math.ceil(inner / itemH);
    if (cols * rows > 600) return null;

    return (
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]}>
        <View
          style={{
            position: 'absolute',
            width: inner,
            height: inner,
            left: (width - inner) / 2,
            top: (height - inner) / 2,
            opacity,
            transform: [{ rotate: `${rotation}deg` }],
          }}
        >
          {Array.from({ length: rows }).map((_, r) => (
            <View key={r} style={{ flexDirection: 'row', marginLeft: r % 2 ? -itemW / 2 : 0 }}>
              {Array.from({ length: cols }).map((__, c) => (
                <View
                  key={c}
                  style={{ width: itemW, height: itemH, flexShrink: 0, alignItems: 'center', justifyContent: 'center' }}
                >
                  {renderItem()}
                </View>
              ))}
            </View>
          ))}
        </View>
      </View>
    );
  }

  /* ---------- Single, draggable watermark ---------- */
  const handleLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setBox((b) => (Math.abs(b.w - w) < 0.5 && Math.abs(b.h - h) < 0.5 ? b : { w, h }));
    if (!readyCalled.current) {
      readyCalled.current = true;
      onReady?.();
    }
  };

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      <View
        onLayout={handleLayout}
        {...(draggable ? pan.panHandlers : {})}
        hitSlop={draggable ? { top: 20, bottom: 20, left: 20, right: 20 } : undefined}
        style={{
          position: 'absolute',
          left: margin + px * travelX,
          top: margin + py * travelY,
          transform: [{ rotate: `${rotation}deg` }],
        }}
      >
        <View style={{ opacity }}>{renderItem()}</View>
        {showHandles && <View pointerEvents="none" style={styles.handle} />}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  handle: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.95)',
    borderRadius: 4,
    backgroundColor: 'rgba(0,0,0,0.12)',
  },
});