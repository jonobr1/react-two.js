import type {
  CanvasBounds,
  CanvasPoint,
  CanvasShapeRecord,
} from '@/canvas/types';
import { getTextShapeDimensions } from '@/utils/textMeasure';

function rotatePointAround(
  point: CanvasPoint,
  center: CanvasPoint,
  rotation: number,
): CanvasPoint {
  const cosine = Math.cos(rotation);
  const sine = Math.sin(rotation);
  const dx = point.x - center.x;
  const dy = point.y - center.y;

  return {
    x: center.x + dx * cosine - dy * sine,
    y: center.y + dx * sine + dy * cosine,
  };
}

function getBoundsFromPoints(points: CanvasPoint[]): CanvasBounds {
  const xs = points.map((point) => point.x);
  const ys = points.map((point) => point.y);
  const minX = Math.min(...xs);
  const minY = Math.min(...ys);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function getRotatedRectangleBounds(
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,
): CanvasBounds {
  if (rotation === 0) {
    return { x, y, width, height };
  }

  const center = { x: x + width / 2, y: y + height / 2 };
  const corners = [
    { x, y },
    { x: x + width, y },
    { x: x + width, y: y + height },
    { x, y: y + height },
  ].map((corner) => rotatePointAround(corner, center, rotation));

  return getBoundsFromPoints(corners);
}

export function expandBounds(bounds: CanvasBounds, padding: number): CanvasBounds {
  return {
    x: bounds.x - padding,
    y: bounds.y - padding,
    width: bounds.width + padding * 2,
    height: bounds.height + padding * 2,
  };
}

export function unionBounds(bounds: CanvasBounds[]): CanvasBounds | null {
  if (bounds.length === 0) {
    return null;
  }

  const minX = Math.min(...bounds.map((bound) => bound.x));
  const minY = Math.min(...bounds.map((bound) => bound.y));
  const maxX = Math.max(...bounds.map((bound) => bound.x + bound.width));
  const maxY = Math.max(...bounds.map((bound) => bound.y + bound.height));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

export function boundsIntersect(a: CanvasBounds, b: CanvasBounds): boolean {
  return !(
    a.x + a.width < b.x ||
    b.x + b.width < a.x ||
    a.y + a.height < b.y ||
    b.y + b.height < a.y
  );
}

export function getShapeBounds(shape: CanvasShapeRecord): CanvasBounds {
  switch (shape.type) {
    case 'rectangle':
    case 'ellipse':
    case 'sticky':
    case 'frame':
      return getRotatedRectangleBounds(
        shape.x,
        shape.y,
        shape.width,
        shape.height,
        shape.rotation,
      );
    case 'text': {
      const textDimensions = getTextShapeDimensions(shape);
      return getRotatedRectangleBounds(
        shape.x,
        shape.y,
        textDimensions.width,
        textDimensions.height,
        shape.rotation,
      );
    }
    case 'arrow':
      return getBoundsFromPoints([
        { x: shape.x, y: shape.y },
        { x: shape.x2, y: shape.y2 },
      ]);
    case 'line':
    case 'path':
      return getBoundsFromPoints(shape.points);
  }
}
