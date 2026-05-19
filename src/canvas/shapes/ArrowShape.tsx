import Two from 'two.js';
import { Group, Path } from '../../../lib/main';
import type { ArrowShapeRecord } from '@/canvas/types';

interface ArrowShapeProps {
  shape: ArrowShapeRecord;
  visible?: boolean;
}

/** Render an arrow record using a line path plus an arrowhead path. */
export function ArrowShape({ shape, visible = true }: ArrowShapeProps) {
  const dx = shape.x2 - shape.x;
  const dy = shape.y2 - shape.y;
  const angle = Math.atan2(dy, dx);
  const headLength = Math.max(12, shape.strokeWidth * 4.5);
  const headSpread = Math.PI / 7;

  const headA = new Two.Anchor(
    dx - Math.cos(angle - headSpread) * headLength,
    dy - Math.sin(angle - headSpread) * headLength,
  );
  const headB = new Two.Anchor(dx, dy);
  const headC = new Two.Anchor(
    dx - Math.cos(angle + headSpread) * headLength,
    dy - Math.sin(angle + headSpread) * headLength,
  );

  return (
    <Group x={shape.x} y={shape.y} visible={visible}>
      <Path
        vertices={[new Two.Anchor(0, 0), new Two.Anchor(dx, dy)]}
        stroke={shape.stroke}
        linewidth={shape.strokeWidth}
        fill="transparent"
        closed={false}
        cap="round"
        join="round"
        opacity={shape.opacity}
        dashes={shape.dash === 'solid' ? [] : shape.dash === 'dashed' ? [14, 10] : [2, 8]}
      />
      <Path
        vertices={[headA, headB, headC]}
        stroke={shape.stroke}
        linewidth={shape.strokeWidth}
        fill="transparent"
        closed={false}
        cap="round"
        join="round"
        opacity={shape.opacity}
      />
    </Group>
  );
}
