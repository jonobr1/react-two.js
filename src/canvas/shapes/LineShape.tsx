import Two from 'two.js';
import { Group, Path } from '../../../lib/main';
import type { LineShapeRecord } from '@/canvas/types';

interface LineShapeProps {
  shape: LineShapeRecord;
  visible?: boolean;
}

/** Render a polyline record using a Two.js path. */
export function LineShape({ shape, visible = true }: LineShapeProps) {
  if (shape.points.length === 0) {
    return null;
  }

  const origin = shape.points[0];
  const vertices = shape.points.map(
    (point) => new Two.Anchor(point.x - origin.x, point.y - origin.y),
  );

  return (
    <Group x={origin.x} y={origin.y} rotation={shape.rotation} visible={visible}>
      <Path
        vertices={vertices}
        stroke={shape.stroke}
        linewidth={shape.strokeWidth}
        fill="transparent"
        closed={false}
        cap="round"
        join="round"
        opacity={shape.opacity}
        dashes={shape.dash === 'solid' ? [] : shape.dash === 'dashed' ? [14, 10] : [2, 8]}
      />
    </Group>
  );
}
