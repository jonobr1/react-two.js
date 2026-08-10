/**
 * Pure gesture math for the ZUI hook. No React, no DOM — everything here is
 * directly unit-testable.
 *
 * Two.js's ZUI treats zoom logarithmically (`scale = Math.exp(zoom)`), so all
 * "delta" helpers below return log-space amounts suitable for `zui.zoomBy()`.
 */

/** Approximate pixel height of one wheel "line" in DOM_DELTA_LINE mode. */
export const LINE_HEIGHT_PX = 16;

/** Log-space units applied per unit of ctrl+wheel (trackpad pinch) delta. */
export const PINCH_WHEEL_FACTOR = 0.01;

/** A single wheel notch in DOM_DELTA_PIXEL mode, used to normalise `speed`. */
export const WHEEL_NOTCH_PX = 100;

export interface Point {
  x: number;
  y: number;
}

export interface PanBounds {
  x?: [number, number];
  y?: [number, number];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Convert a `WheelEvent.deltaY` into pixels, accounting for `deltaMode`.
 * Firefox reports lines (mode 1); some environments report pages (mode 2).
 */
export function normalizeWheelDelta(
  deltaY: number,
  deltaMode: number,
  viewportHeight: number
): number {
  switch (deltaMode) {
    case 1:
      return deltaY * LINE_HEIGHT_PX;
    case 2:
      return deltaY * viewportHeight;
    default:
      return deltaY;
  }
}

/**
 * Log-space zoom delta for a standard scroll wheel. `speed` is expressed in
 * log units per notch, so the default of 0.05 means one notch changes scale
 * by a factor of e^0.05 (~5%).
 */
export function wheelZoomDelta(
  deltaY: number,
  deltaMode: number,
  speed: number,
  viewportHeight: number
): number {
  const pixels = normalizeWheelDelta(deltaY, deltaMode, viewportHeight);
  return (-pixels / WHEEL_NOTCH_PX) * speed;
}

/** Log-space zoom delta for a trackpad pinch, which arrives as ctrl+wheel. */
export function pinchWheelZoomDelta(deltaY: number): number {
  return -deltaY * PINCH_WHEEL_FACTOR;
}

/**
 * Log-space zoom delta for a two-finger pinch. Using the log of the distance
 * ratio makes the gesture feel identical at every zoom level — the WIP branch
 * used a linear pixel difference, which did not.
 */
export function pinchZoomDelta(
  prevDistance: number,
  nextDistance: number
): number {
  if (prevDistance <= 0 || nextDistance <= 0) {
    return 0;
  }
  return Math.log(nextDistance / prevDistance);
}

export function distance(a: Point, b: Point): number {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.sqrt(dx * dx + dy * dy);
}

export function centroid(points: Point[]): Point {
  if (points.length === 0) {
    return { x: 0, y: 0 };
  }
  let x = 0;
  let y = 0;
  for (const point of points) {
    x += point.x;
    y += point.y;
  }
  return { x: x / points.length, y: y / points.length };
}
