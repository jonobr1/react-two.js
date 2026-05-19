import { getShapeBounds } from '@/utils/boundingBox';
import type { CanvasPoint, CanvasShapeRecord } from '@/canvas/types';
import { getTextShapeDimensions } from '@/utils/textMeasure';

function rotateIntoLocalSpace(
  point: CanvasPoint,
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,
): CanvasPoint {
  if (rotation === 0) {
    return point;
  }

  const centerX = x + width / 2;
  const centerY = y + height / 2;
  const cosine = Math.cos(-rotation);
  const sine = Math.sin(-rotation);
  const dx = point.x - centerX;
  const dy = point.y - centerY;

  return {
    x: centerX + dx * cosine - dy * sine,
    y: centerY + dx * sine + dy * cosine,
  };
}

function distanceToSegment(point: CanvasPoint, start: CanvasPoint, end: CanvasPoint) {
  const dx = end.x - start.x;
  const dy = end.y - start.y;

  if (dx === 0 && dy === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  const projection = Math.max(
    0,
    Math.min(
      1,
      ((point.x - start.x) * dx + (point.y - start.y) * dy) /
        (dx * dx + dy * dy),
    ),
  );

  const closest = {
    x: start.x + projection * dx,
    y: start.y + projection * dy,
  };

  return Math.hypot(point.x - closest.x, point.y - closest.y);
}

function hitPolyline(point: CanvasPoint, points: CanvasPoint[], tolerance: number) {
  for (let index = 0; index < points.length - 1; index += 1) {
    if (distanceToSegment(point, points[index], points[index + 1]) <= tolerance) {
      return true;
    }
  }

  return false;
}

function hitRectangle(
  point: CanvasPoint,
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,
) {
  const localPoint = rotateIntoLocalSpace(point, x, y, width, height, rotation);

  return (
    localPoint.x >= x &&
    localPoint.x <= x + width &&
    localPoint.y >= y &&
    localPoint.y <= y + height
  );
}

function hitEllipse(
  point: CanvasPoint,
  x: number,
  y: number,
  width: number,
  height: number,
  rotation: number,
) {
  const localPoint = rotateIntoLocalSpace(point, x, y, width, height, rotation);
  const rx = width / 2;
  const ry = height / 2;
  const cx = x + rx;
  const cy = y + ry;

  if (rx === 0 || ry === 0) {
    return false;
  }

  const normalizedX = (localPoint.x - cx) / rx;
  const normalizedY = (localPoint.y - cy) / ry;

  return normalizedX * normalizedX + normalizedY * normalizedY <= 1;
}

export function hitTestShape(
  shape: CanvasShapeRecord,
  point: CanvasPoint,
  tolerance = 6,
): boolean {
  const bounds = getShapeBounds(shape);

  if (
    point.x < bounds.x - tolerance ||
    point.x > bounds.x + bounds.width + tolerance ||
    point.y < bounds.y - tolerance ||
    point.y > bounds.y + bounds.height + tolerance
  ) {
    return false;
  }

  switch (shape.type) {
    case 'rectangle':
    case 'sticky':
    case 'frame':
      return hitRectangle(
        point,
        shape.x,
        shape.y,
        shape.width,
        shape.height,
        shape.rotation,
      );
    case 'text': {
      const { width, height } = getTextShapeDimensions(shape);
      return hitRectangle(point, shape.x, shape.y, width, height, shape.rotation);
    }
    case 'ellipse':
      return hitEllipse(
        point,
        shape.x,
        shape.y,
        shape.width,
        shape.height,
        shape.rotation,
      );
    case 'arrow':
      return (
        distanceToSegment(
          point,
          { x: shape.x, y: shape.y },
          { x: shape.x2, y: shape.y2 },
        ) <= tolerance
      );
    case 'line':
    case 'path':
      return hitPolyline(point, shape.points, tolerance);
  }
}
