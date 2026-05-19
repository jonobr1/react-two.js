import { Group, Text } from '../../../lib/main';
import type { TextShapeRecord } from '@/canvas/types';

interface TextShapeProps {
  shape: TextShapeRecord;
  visible?: boolean;
}

/** Render a text record using a Two.js text primitive. */
export function TextShape({ shape, visible = true }: TextShapeProps) {
  return (
    <Group x={shape.x} y={shape.y} rotation={shape.rotation} visible={visible}>
      <Text
        value={shape.text}
        fill={shape.fill}
        size={shape.fontSize}
        family={shape.fontFamily}
        alignment={shape.align}
        baseline="top"
        opacity={shape.opacity}
      />
    </Group>
  );
}
