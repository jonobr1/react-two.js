import { memo, useMemo } from 'react';
import Two from 'two.js';
import { Group, Line, Points } from 'react-two.js';

export interface GraphLineProps {
  x: number;
  top: number;
  bottom: number;
  points: { x: number; y: number }[];
  highlightYList: number[];
}

export const GraphLine = memo(function GraphLine({
  x,
  top,
  bottom,
  points,
  highlightYList,
}: GraphLineProps) {
  const tickVertices = useMemo(() => {
    return points.map((p) => new Two.Vector(p.x, p.y));
  }, [points]);

  const highlightVertices = useMemo(() => {
    return highlightYList.map((y) => new Two.Vector(x, y));
  }, [x, highlightYList]);

  return (
    <Group>
      {points.length > 0 && (
        <Line x1={x} y1={top} x2={x} y2={bottom} stroke="#777" linewidth={1} />
      )}
      {tickVertices.length > 0 && (
        <Points vertices={tickVertices} size={4} fill="#777" stroke="none" />
      )}
      {highlightVertices.length > 0 && (
        <Points vertices={highlightVertices} size={12} fill="yellow" stroke="none" />
      )}
    </Group>
  );
});
