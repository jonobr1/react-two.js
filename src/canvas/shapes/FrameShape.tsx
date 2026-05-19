import { Group, Rectangle, Text } from '../../../lib/main';
import type { FrameShapeRecord } from '@/canvas/types';

interface FrameShapeProps {
  shape: FrameShapeRecord;
  visible?: boolean;
}

/** Render a frame record using a transparent rectangle plus label. */
export function FrameShape({ shape, visible = true }: FrameShapeProps) {
  return (
    <Group x={shape.x} y={shape.y} rotation={shape.rotation} visible={visible}>
      <Rectangle
        x={shape.width / 2}
        y={shape.height / 2}
        width={shape.width}
        height={shape.height}
        fill={shape.fill}
        stroke={shape.stroke}
        linewidth={shape.strokeWidth}
        opacity={shape.opacity}
      />
      <Text
        x={8}
        y={8}
        value={shape.label}
        fill={shape.stroke}
        size={shape.fontSize}
        family={shape.fontFamily}
        alignment="left"
        baseline="top"
        opacity={shape.opacity}
      />
    </Group>
  );
}
