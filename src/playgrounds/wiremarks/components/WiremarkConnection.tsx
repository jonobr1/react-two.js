import { useMemo, useRef } from 'react';
import Two from 'two.js';
import {
  Group,
  Path,
  Text,
  useFrame,
  type RefPath,
  type RefText,
} from 'react-two.js';
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

const labelSize = textStyles.size * 0.75;

// Sampled either side of the curve's midpoint to derive a tangent.
const LABEL_T_BEFORE = 0.45;
const LABEL_T_AFTER = 0.55;

export function WiremarkConnection({
  edge,
  sourceNode,
  targetNode,
  sourceOffsetIndex = 0,
  totalSourceConnections = 1,
}: WiremarkConnectionProps) {
  const pathRef = useRef<RefPath | null>(null);
  const labelRef = useRef<RefText | null>(null);
  const points = useMemo(() => {
    if (!sourceNode || !targetNode) return null;

    const offsetPct =
      (sourceOffsetIndex + 0.5) / Math.max(1, totalSourceConnections);
    const offsetY = offsetPct * sourceNode.height - sourceNode.height * 0.5;

    const p0: Vector2D = { x: sourceNode.x, y: sourceNode.y + offsetY };
    const p1: Vector2D = {
      x: sourceNode.x + sourceNode.width * 0.5,
      y: sourceNode.y + offsetY,
    };
    const p2: Vector2D = {
      x: targetNode.x - targetNode.width * 0.5,
      y: targetNode.y,
    };
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

  // Stable across renders so the offset mutated below survives re-renders.
  // Two.js stores the dashes array by reference, so re-assigning the same
  // object leaves the running offset intact.
  const dashesPattern = useMemo(() => {
    return Object.assign([unit * 0.03, unit * 0.045], { offset: 0 });
  }, []);

  useFrame((_, frameDelta) => {
    const path = pathRef.current;
    if (!path) return;

    // Animate the marching-ants offset directly on the Two.js path. Driving
    // this through React state re-renders the entire graph every frame.
    const dashes = path.dashes as unknown as { offset: number } | undefined;
    if (dashes) {
      dashes.offset -= frameDelta / 10;
    }

    // Sit the label on the curve Two.js actually renders. `curved` paths are
    // catmull-rom-like splines *through* every anchor, so treating the middle
    // anchors as Bezier control points puts the label off the line and skews
    // its angle. getPointAt samples the real curve by arc length.
    const label = labelRef.current;
    if (!label) return;

    const a = path.getPointAt(LABEL_T_BEFORE) as unknown as Vector2D;
    const b = path.getPointAt(LABEL_T_AFTER) as unknown as Vector2D;
    if (!a || !b) return;

    const angle = Math.atan2(b.y - a.y, b.x - a.x);
    const ox = labelSize * Math.cos(angle - HALF_PI);
    const oy = labelSize * Math.sin(angle - HALF_PI);

    label.position.x = 0.5 * (b.x - a.x) + a.x + ox;
    label.position.y = 0.5 * (b.y - a.y) + a.y + oy;
    label.rotation = angle;
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
      {edge.label && (
        <Text
          /* Position and rotation are owned by the frame loop above — passing
             x/y/rotation props here would overwrite them every render. */
          ref={labelRef}
          value={edge.label}
          size={labelSize}
          fill={edge.color}
          family={textStyles.family}
          baseline="middle"
          alignment="center"
        />
      )}
    </Group>
  );
}
