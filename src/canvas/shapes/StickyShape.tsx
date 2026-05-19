import { Group, RoundedRectangle, Text } from '../../../lib/main';
import type { StickyShapeRecord } from '@/canvas/types';

interface StickyShapeProps {
  shape: StickyShapeRecord;
  visible?: boolean;
}

/** Render a sticky note record using a rectangle plus text. */
export function StickyShape({ shape, visible = true }: StickyShapeProps) {
  return (
    <Group x={shape.x} y={shape.y} rotation={shape.rotation} visible={visible}>
      <RoundedRectangle
        x={shape.width / 2}
        y={shape.height / 2}
        width={shape.width}
        height={shape.height}
        radius={14}
        fill={shape.fill}
        stroke={shape.stroke}
        linewidth={shape.strokeWidth}
        opacity={shape.opacity}
      />
      <Text
        x={16}
        y={18}
        value={shape.text}
        fill="#3f3212"
        size={shape.fontSize}
        family={shape.fontFamily}
        alignment="left"
        baseline="top"
        opacity={shape.opacity}
      />
    </Group>
  );
}
