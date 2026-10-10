import { useEffect, useMemo, useRef, useState } from 'react';
import { LayoutChangeEvent, PanResponder, StyleSheet, Text, View } from 'react-native';
import { FONTS, resolveFont } from '../constants/fonts';
import { withAlpha } from '../utils/color';
import { clamp } from '../utils/math';

export type TextLayer = {
  id: string;
  text: string;
  fontKey: string;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strike: boolean;
  align: 'left' | 'center' | 'right';
  color: string;
  sizePct: number; // % of image width
  opacity: number; // 0–1
  rotation: number; // degrees
  bgOn: boolean;
  bgColor: string;
  bgOpacity: number; // 0–1
  shadowOn: boolean;
  shadowColor: string;
  shadowBlur: number; // units relative to a 360-wide image
  shadowX: number;
  shadowY: number;
  px: number; // 0 = left edge, 1 = right edge
  py: number; // 0 = top edge, 1 = bottom edge
};

export const isVisible = (l: TextLayer) => l.text.trim().length > 0;

type Props = {
  width: number;
  height: number;
  layers: TextLayer[];
  selectedId?: string | null;
  interactive?: boolean; // preview only: drag + select
  onSelect?: (id: string) => void;
  onMove?: (id: string, px: number, py: number) => void;
  onDragState?: (active: boolean) => void;
  onAllMeasured?: () => void; // used by the export so it knows when everything is laid out
};

export default function TextOverlay({
  width, height, layers, selectedId, interactive, onSelect, onMove, onDragState, onAllMeasured,
}: Props) {
  const visible = layers.filter(isVisible);
  const measured = useRef(new Set<string>());
  const fired = useRef(false);

  const handleMeasured = (id: string) => {
    measured.current.add(id);
    if (!fired.current && visible.every((l) => measured.current.has(l.id))) {
      fired.current = true;
      onAllMeasured?.();
    }
  };

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {visible.map((layer) => (
        <DraggableText
          key={layer.id}
          layer={layer}
          width={width}
          height={height}
          selected={layer.id === selectedId}
          interactive={!!interactive}
          onSelect={onSelect}
          onMove={onMove}
          onDragState={onDragState}
          onMeasured={handleMeasured}
        />
      ))}
    </View>
  );
}

type ItemProps = {
  layer: TextLayer;
  width: number;
  height: number;
  selected: boolean;
  interactive: boolean;
  onSelect?: (id: string) => void;
  onMove?: (id: string, px: number, py: number) => void;
  onDragState?: (active: boolean) => void;
  onMeasured: (id: string) => void;
};

function DraggableText({ layer, width, height, selected, interactive, onSelect, onMove, onDragState, onMeasured }: ItemProps) {
  const [box, setBox] = useState({ w: 0, h: 0 });
  const travelX = Math.max(0, width - box.w);
  const travelY = Math.max(0, height - box.h);

  const live = useRef({ layer, travelX, travelY, interactive, onSelect, onMove, onDragState });
  live.current = { layer, travelX, travelY, interactive, onSelect, onMove, onDragState };
  const start = useRef({ px: 0, py: 0 });

  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => live.current.interactive,
        onPanResponderTerminationRequest: () => false,
        onPanResponderGrant: () => {
          const { layer, onSelect, onDragState } = live.current;
          start.current = { px: layer.px, py: layer.py };
          onSelect?.(layer.id);
          onDragState?.(true);
        },
        onPanResponderMove: (_, g) => {
          const { layer, travelX, travelY, onMove } = live.current;
          const nx = travelX > 1 ? clamp(start.current.px + g.dx / travelX, 0, 1) : 0.5;
          const ny = travelY > 1 ? clamp(start.current.py + g.dy / travelY, 0, 1) : 0.5;
          onMove?.(layer.id, nx, ny);
        },
        onPanResponderRelease: () => live.current.onDragState?.(false),
        onPanResponderTerminate: () => live.current.onDragState?.(false),
      }),
    []
  );

  useEffect(() => {
    if (box.w > 0) onMeasured(layer.id);
  }, [box.w, box.h]);

  const handleLayout = (e: LayoutChangeEvent) => {
    const { width: w, height: h } = e.nativeEvent.layout;
    setBox((b) => (Math.abs(b.w - w) < 0.5 && Math.abs(b.h - h) < 0.5 ? b : { w, h }));
  };

  const fontDef = FONTS.find((f) => f.key === layer.fontKey) ?? FONTS[0];
  const font = resolveFont(fontDef, layer.bold, layer.italic);
  const fs = (layer.sizePct / 100) * width;
  const k = width / 360; // keeps shadow sizes proportional on any image size

  const decoration = [layer.underline && 'underline', layer.strike && 'line-through'].filter(Boolean).join(' ');

  const shadow = layer.shadowOn
    ? {
        textShadowColor: layer.shadowColor,
        textShadowOffset: { width: layer.shadowX * k, height: layer.shadowY * k },
        textShadowRadius: Math.max(layer.shadowBlur * k, 0.5),
      }
    : {};

  return (
    <View
      onLayout={handleLayout}
      {...(interactive ? pan.panHandlers : {})}
      hitSlop={interactive ? { top: 16, bottom: 16, left: 16, right: 16 } : undefined}
      style={{
        position: 'absolute',
        left: 0,
        top: 0,
        maxWidth: width * 0.95,
        opacity: layer.opacity,
        transform: [
          { translateX: layer.px * travelX },
          { translateY: layer.py * travelY },
          { rotate: `${layer.rotation}deg` },
        ],
      }}
    >
      <View
        style={{
          backgroundColor: layer.bgOn ? withAlpha(layer.bgColor, layer.bgOpacity) : 'transparent',
          paddingHorizontal: layer.bgOn ? fs * 0.35 : 0,
          paddingVertical: layer.bgOn ? fs * 0.2 : 0,
          borderRadius: fs * 0.25,
        }}
      >
        <Text
          style={[
            { fontSize: fs, color: layer.color, textAlign: layer.align, textDecorationLine: (decoration || 'none') as any },
            font,
            shadow,
          ]}
        >
          {layer.text}
        </Text>
      </View>

      {selected && interactive && <View pointerEvents="none" style={styles.outline} />}
    </View>
  );
}

const styles = StyleSheet.create({
  outline: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.95)',
    borderRadius: 4,
  },
});