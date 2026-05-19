import { Ellipse, Group } from '../../../lib/main';
import type { EllipseShapeRecord } from '@/canvas/types';

interface EllipseShapeProps {
  shape: EllipseShapeRecord;
  visible?: boolean;
}

/** Render an ellipse record using Two.js primitives. */
export function EllipseShape({ shape, visible = true }: EllipseShapeProps) {
  return (
    <Group x={shape.x} y={shape.y} rotation={shape.rotation} visible={visible}>
      <Ellipse
        x={shape.width / 2}
        y={shape.height / 2}
        width={shape.width}
        height={shape.height}
        fill={shape.fill}
        stroke={shape.stroke}
        linewidth={shape.strokeWidth}
        opacity={shape.opacity}
        dashes={shape.dash === 'solid' ? [] : shape.dash === 'dashed' ? [14, 10] : [2, 8]}
      />
    </Group>
  );
}
