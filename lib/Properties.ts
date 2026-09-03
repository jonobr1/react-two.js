import Two from 'two.js';
import type { Vector } from 'two.js/src/vector';

// Re-export event handler types for convenience
export type { EventHandlers, EventHandler, TwoEvent } from './Events';

export type ElementProps = 'id' | 'className';
export type ShapeProps =
  | ElementProps
  | 'position'
  | 'translation'
  | 'rotation'
  | 'scale'
  | 'skewX'
  | 'skewY'
  | 'matrix';
export type GradientProps = ElementProps | 'spread' | 'units' | 'stops';

export const ELEMENT_PROPERTIES = ['id', 'className'] as const;
export const SHAPE_PROPERTIES = [
  'id',
  'className',
  'position',
  'translation',
  'rotation',
  'scale',
  'skewX',
  'skewY',
  'matrix',
] as const;
export const GRADIENT_PROPERTIES = [
  'id',
  'className',
  'spread',
  'units',
  'stops',
] as const;

export type OriginProp =
  | Vector
  | { x?: number; y?: number }
  | readonly [number, number]
  | [number, number];

/**
 * Normalizes and applies origin coordinates onto a Two.js shape instance.
 */
export function applyOrigin(
  instance: { origin: Vector },
  origin: OriginProp | undefined
): void {
  if (typeof origin === 'undefined') return;

  if (origin instanceof Two.Vector) {
    instance.origin = origin;
  } else if (Array.isArray(origin) && origin.length >= 2) {
    instance.origin.set(origin[0], origin[1]);
  } else if (typeof origin === 'object' && origin !== null) {
    const originObj = origin as { x?: number; y?: number };
    if (typeof originObj.x === 'number') instance.origin.x = originObj.x;
    if (typeof originObj.y === 'number') instance.origin.y = originObj.y;
  }
}


