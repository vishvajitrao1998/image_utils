import { Image, StyleSheet, Text, View } from 'react-native';

export type WatermarkPosition = 'tl' | 'tc' | 'tr' | 'ml' | 'mc' | 'mr' | 'bl' | 'bc' | 'br';

export type WatermarkConfig = {
  kind: 'text' | 'logo';
  text: string;
  color: string;
  logoUri: string | null;
  logoAspect: number; // logo width / height
  sizePct: number; // % of image width (font size for text, logo width for logos)
  opacity: number; // 0–1
  rotation: number; // degrees
  position: WatermarkPosition;
  tile: boolean;
};

export const hasWatermark = (c: WatermarkConfig) =>
  c.kind === 'text' ? c.text.trim().length > 0 : !!c.logoUri;

const ROW = { t: 'flex-start', m: 'center', b: 'flex-end' } as const;
const COL = { l: 'flex-start', c: 'center', r: 'flex-end' } as const;

type Props = { width: number; height: number; config: WatermarkConfig };

export default function WatermarkLayer({ width, height, config }: Props) {
  const { kind, text, color, logoUri, logoAspect, sizePct, opacity, rotation, position, tile } = config;
  if (!hasWatermark(config)) return null;

  const base = (sizePct / 100) * width;
  const fontSize = base;
  const logoW = base;
  const logoH = base / (logoAspect || 1);

  const shadow =
    color.toLowerCase() === '#111111'
      ? {}
      : {
          textShadowColor: 'rgba(0,0,0,0.35)',
          textShadowOffset: { width: 0, height: width * 0.002 },
          textShadowRadius: width * 0.006,
        };

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
    const inner = Math.hypot(width, height) * 1.1; // big enough to still cover the corners after rotating
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

  /* ---------- Single watermark ---------- */
  const row = position.charAt(0) as 't' | 'm' | 'b';
  const col = position.charAt(1) as 'l' | 'c' | 'r';

  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        { padding: width * 0.04, justifyContent: ROW[row], alignItems: COL[col] },
      ]}
    >
      <View style={{ opacity, transform: [{ rotate: `${rotation}deg` }] }}>{renderItem()}</View>
    </View>
  );
}