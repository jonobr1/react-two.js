import { Group, Rectangle, RoundedRectangle } from '../../../lib/main';
import type { RectangleShapeRecord } from '@/canvas/types';

interface RectangleShapeProps {
  shape: RectangleShapeRecord;
  visible?: boolean;
}

/** Render a rectangle record using Two.js primitives. */
export function RectangleShape({ shape, visible = true }: RectangleShapeProps) {
  const commonProps = {
    x: shape.width / 2,
    y: shape.height / 2,
    width: shape.width,
    height: shape.height,
    fill: shape.fill,
    stroke: shape.stroke,
    linewidth: shape.strokeWidth,
    opacity: shape.opacity,
    dashes: shape.dash === 'solid' ? [] : shape.dash === 'dashed' ? [14, 10] : [2, 8],
  };

  return (
    <Group x={shape.x} y={shape.y} rotation={shape.rotation} visible={visible}>
      {shape.radius > 0 ? (
        <RoundedRectangle {...commonProps} radius={shape.radius} />
      ) : (
        <Rectangle {...commonProps} />
      )}
    </Group>
  );
}
