import { useMemo, useRef } from 'react';
import Two from 'two.js';
import { Group, Path, Text, useFrame, type RefPath } from 'react-two.js';
import { WiremarkEdge, WiremarkNode, Vector2D } from '../types';
import { unit, textStyles } from '../constants';

interface WiremarkConnectionProps {
  edge: WiremarkEdge;
  sourceNode?: WiremarkNode;
  targetNode?: WiremarkNode;
  sourceOffsetIndex?: number;
  totalSourceConnections?: number;
}

const HALF_PI = Math.PI * 0.5;

function cubicBezier(p0: Vector2D, p1: Vector2D, p2: Vector2D, p3: Vector2D, t: number): Vector2D {
  const oneMinusT = 1 - t;
  const a = oneMinusT * oneMinusT * oneMinusT;
  const b = 3 * oneMinusT * oneMinusT * t;
  const c = 3 * oneMinusT * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
}

export function WiremarkConnection({
  edge,
  sourceNode,
  targetNode,
  sourceOffsetIndex = 0,
  totalSourceConnections = 1,
}: WiremarkConnectionProps) {
  const pathRef = useRef<RefPath | null>(null);
  const points = useMemo(() => {
    if (!sourceNode || !targetNode) return null;

    const offsetPct = (sourceOffsetIndex + 0.5) / Math.max(1, totalSourceConnections);
    const offsetY = offsetPct * sourceNode.height - sourceNode.height * 0.5;

    const p0: Vector2D = { x: sourceNode.x, y: sourceNode.y + offsetY };
    const p1: Vector2D = { x: sourceNode.x + sourceNode.width * 0.5, y: sourceNode.y + offsetY };
    const p2: Vector2D = { x: targetNode.x - targetNode.width * 0.5, y: targetNode.y };
    const p3: Vector2D = { x: targetNode.x, y: targetNode.y };

    return { p0, p1, p2, p3 };
  }, [sourceNode, targetNode, sourceOffsetIndex, totalSourceConnections]);

  const vertices = useMemo(() => {
    if (!points) return [];
    const { p0, p1, p2, p3 } = points;
    return [
      new Two.Anchor(p0.x, p0.y),
      new Two.Anchor(p1.x, p1.y),
      new Two.Anchor(p2.x, p2.y),
      new Two.Anchor(p3.x, p3.y),
    ];
  }, [points]);

  const labelInfo = useMemo(() => {
    if (!edge.label || !points) return null;
    const { p0, p1, p2, p3 } = points;

    const ptA = cubicBezier(p0, p1, p2, p3, 0.45);
    const ptB = cubicBezier(p0, p1, p2, p3, 0.55);
    const angle = Math.atan2(ptB.y - ptA.y, ptB.x - ptA.x);
    const labelSize = textStyles.size * 0.75;

    const ox = labelSize * Math.cos(angle - HALF_PI);
    const oy = labelSize * Math.sin(angle - HALF_PI);

    return {
      x: 0.5 * (ptB.x - ptA.x) + ptA.x + ox,
      y: 0.5 * (ptB.y - ptA.y) + ptA.y + oy,
      rotation: angle,
      size: labelSize,
    };
  }, [edge.label, points]);

  // Stable across renders so the offset mutated below survives re-renders.
  // Two.js stores the dashes array by reference, so re-assigning the same
  // object leaves the running offset intact.
  const dashesPattern = useMemo(() => {
    return Object.assign([unit * 0.03, unit * 0.045], { offset: 0 });
  }, []);

  // Animate the marching-ants offset directly on the Two.js path. Driving
  // this through React state re-renders the entire graph every frame.
  useFrame((_, frameDelta) => {
    const dashes = pathRef.current?.dashes as unknown as
      | { offset: number }
      | undefined;
    if (dashes) {
      dashes.offset -= frameDelta / 10;
    }
  });

  if (!sourceNode || !targetNode || !points) {
    return null;
  }

  return (
    <Group>
      <Path
        ref={pathRef}
        vertices={vertices}
        curved={true}
        stroke={edge.color}
        linewidth={unit * 0.015}
        fill="transparent"
        dashes={dashesPattern}
        cap="round"
        join="round"
      />
      {edge.label && labelInfo && (
        <Text
          x={labelInfo.x}
          y={labelInfo.y}
          rotation={labelInfo.rotation}
          value={edge.label}
          size={labelInfo.size}
          fill={edge.color}
          family={textStyles.family}
          baseline="middle"
          alignment="center"
        />
      )}
    </Group>
  );
}
