import type { TextShapeRecord } from '@/canvas/types';

const FALLBACK_GLYPH_WIDTH = 0.6;
const LINE_HEIGHT = 1.2;

let cachedContext: CanvasRenderingContext2D | null | undefined;

function getMeasureContext(): CanvasRenderingContext2D | null {
  if (cachedContext !== undefined) {
    return cachedContext;
  }

  if (typeof document === 'undefined') {
    cachedContext = null;
    return cachedContext;
  }

  const canvas = document.createElement('canvas');
  cachedContext = canvas.getContext('2d');
  return cachedContext;
}

/** Measure the rendered size of a text record using a shared canvas context. */
export function getTextShapeDimensions(shape: TextShapeRecord) {
  const lines = shape.text.split('\n');
  const context = getMeasureContext();

  if (!context) {
    return {
      width: Math.max(...lines.map((line) => line.length * shape.fontSize * FALLBACK_GLYPH_WIDTH)),
      height: lines.length * shape.fontSize * LINE_HEIGHT,
    };
  }

  context.font = `${shape.fontSize}px ${shape.fontFamily}`;

  const width = Math.max(
    ...lines.map((line) => {
      const metrics = context.measureText(line);
      return metrics.width;
    }),
  );

  return {
    width,
    height: lines.length * shape.fontSize * LINE_HEIGHT,
  };
}
