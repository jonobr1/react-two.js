import type { CanvasShapeRecord } from '@/canvas/types';
import { ArrowShape } from '@/canvas/shapes/ArrowShape';
import { EllipseShape } from '@/canvas/shapes/EllipseShape';
import { FrameShape } from '@/canvas/shapes/FrameShape';
import { LineShape } from '@/canvas/shapes/LineShape';
import { PathShape } from '@/canvas/shapes/PathShape';
import { RectangleShape } from '@/canvas/shapes/RectangleShape';
import { StickyShape } from '@/canvas/shapes/StickyShape';
import { TextShape } from '@/canvas/shapes/TextShape';

interface CanvasShapeRendererProps {
  shape: CanvasShapeRecord;
  visible?: boolean;
}

/** Render any supported canvas record as a Two.js subtree. */
export function CanvasShapeRenderer({
  shape,
  visible = true,
}: CanvasShapeRendererProps) {
  switch (shape.type) {
    case 'rectangle':
      return <RectangleShape shape={shape} visible={visible} />;
    case 'ellipse':
      return <EllipseShape shape={shape} visible={visible} />;
    case 'arrow':
      return <ArrowShape shape={shape} visible={visible} />;
    case 'line':
      return <LineShape shape={shape} visible={visible} />;
    case 'path':
      return <PathShape shape={shape} visible={visible} />;
    case 'text':
      return <TextShape shape={shape} visible={visible} />;
    case 'sticky':
      return <StickyShape shape={shape} visible={visible} />;
    case 'frame':
      return <FrameShape shape={shape} visible={visible} />;
  }
}
