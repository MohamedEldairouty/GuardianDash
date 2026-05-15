import React, { useMemo } from 'react';
import { Image, StyleSheet, View, type ViewStyle } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '@/constants/colors';

const TILE_SIZE = 256;

// Web Mercator projection — copy of the canonical formulas.
function lngLatToTile(lng: number, lat: number, z: number) {
  const x = ((lng + 180) / 360) * Math.pow(2, z);
  const y =
    ((1 - Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) / Math.PI) / 2) *
    Math.pow(2, z);
  return { x, y };
}

export interface TileMapProps {
  center: { lat: number; lng: number };
  zoom?: number;
  width: number;
  height: number;
  path?: { lat: number; lng: number }[];
  markers?: { lat: number; lng: number; color?: string; pulse?: boolean }[];
  style?: ViewStyle;
  rounded?: number;
}

export function TileMap({
  center,
  zoom = 15,
  width,
  height,
  path,
  markers,
  style,
  rounded = 18,
}: TileMapProps) {
  const layout = useMemo(() => {
    const c = lngLatToTile(center.lng, center.lat, zoom);
    const cxPx = c.x * TILE_SIZE;
    const cyPx = c.y * TILE_SIZE;

    const left = cxPx - width / 2;
    const top = cyPx - height / 2;

    const minTileX = Math.floor(left / TILE_SIZE);
    const maxTileX = Math.floor((left + width) / TILE_SIZE);
    const minTileY = Math.floor(top / TILE_SIZE);
    const maxTileY = Math.floor((top + height) / TILE_SIZE);

    const tiles: { x: number; y: number; left: number; top: number }[] = [];
    for (let tx = minTileX; tx <= maxTileX; tx++) {
      for (let ty = minTileY; ty <= maxTileY; ty++) {
        if (ty < 0 || ty >= Math.pow(2, zoom)) continue;
        const wrappedX = ((tx % Math.pow(2, zoom)) + Math.pow(2, zoom)) % Math.pow(2, zoom);
        tiles.push({
          x: wrappedX,
          y: ty,
          left: tx * TILE_SIZE - left,
          top: ty * TILE_SIZE - top,
        });
      }
    }

    const project = (lat: number, lng: number) => {
      const t = lngLatToTile(lng, lat, zoom);
      return { x: t.x * TILE_SIZE - left, y: t.y * TILE_SIZE - top };
    };

    return { tiles, project };
  }, [center.lat, center.lng, zoom, width, height]);

  const pathD = useMemo(() => {
    if (!path || path.length < 2) return '';
    return path
      .map((p, i) => {
        const pt = layout.project(p.lat, p.lng);
        return `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`;
      })
      .join(' ');
  }, [path, layout]);

  return (
    <View style={[{ width, height, borderRadius: rounded, overflow: 'hidden', backgroundColor: colors.surface }, style]}>
      {layout.tiles.map((t) => (
        <Image
          key={`${t.x}-${t.y}`}
          source={{ uri: `https://tile.openstreetmap.org/${zoom}/${t.x}/${t.y}.png` }}
          style={{
            position: 'absolute',
            left: t.left,
            top: t.top,
            width: TILE_SIZE,
            height: TILE_SIZE,
          }}
        />
      ))}

      {/* Dark overlay to match theme */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { backgroundColor: '#0B0F1A', opacity: 0.35 }]} />

      <Svg width={width} height={height} style={StyleSheet.absoluteFillObject}>
        {pathD ? (
          <>
            <Path d={pathD} stroke={colors.primary} strokeWidth={6} fill="none" opacity={0.25} strokeLinecap="round" strokeLinejoin="round" />
            <Path d={pathD} stroke={colors.primaryGlow} strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </>
        ) : null}

        {markers?.map((m, i) => {
          const pt = layout.project(m.lat, m.lng);
          const color = m.color ?? colors.primary;
          return (
            <React.Fragment key={i}>
              {m.pulse !== false && <Circle cx={pt.x} cy={pt.y} r={14} fill={color} opacity={0.25} />}
              <Circle cx={pt.x} cy={pt.y} r={7} fill={color} />
              <Circle cx={pt.x} cy={pt.y} r={3} fill="#fff" />
            </React.Fragment>
          );
        })}
      </Svg>
    </View>
  );
}

