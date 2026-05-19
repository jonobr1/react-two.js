import type { CanvasPoint } from '@/canvas/types';

function perpendicularDistance(
  point: CanvasPoint,
  start: CanvasPoint,
  end: CanvasPoint,
): number {
  const area = Math.abs(
    0.5 *
      (start.x * end.y +
        end.x * point.y +
        point.x * start.y -
        end.x * start.y -
        point.x * end.y -
        start.x * point.y),
  );
  const base = Math.hypot(end.x - start.x, end.y - start.y);

  if (base === 0) {
    return Math.hypot(point.x - start.x, point.y - start.y);
  }

  return (area * 2) / base;
}

export function simplifyPath(
  points: CanvasPoint[],
  epsilon = 2,
): CanvasPoint[] {
  if (points.length < 3) {
    return points;
  }

  let maxDistance = 0;
  let index = 0;

  for (let cursor = 1; cursor < points.length - 1; cursor += 1) {
    const distance = perpendicularDistance(
      points[cursor],
      points[0],
      points[points.length - 1],
    );

    if (distance > maxDistance) {
      index = cursor;
      maxDistance = distance;
    }
  }

  if (maxDistance > epsilon) {
    const left = simplifyPath(points.slice(0, index + 1), epsilon);
    const right = simplifyPath(points.slice(index), epsilon);

    return [...left.slice(0, -1), ...right];
  }

  return [points[0], points[points.length - 1]];
}
