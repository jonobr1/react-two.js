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

export type VectorProp =
  | Vector
  | { x?: number; y?: number }
  | readonly [number, number]
  | [number, number];

export type OriginProp = VectorProp;

export type ScaleProp =
  | number
  | Vector
  | { x?: number; y?: number }
  | readonly [number, number]
  | [number, number];

/**
 * Normalizes and applies vector coordinates onto a Two.js Vector instance.
 */
export function applyVector(
  target: Vector,
  source: VectorProp | undefined
): void {
  if (typeof source === 'undefined') return;

  if (source instanceof Two.Vector) {
    target.copy(source);
  } else if (Array.isArray(source) && source.length >= 2) {
    target.set(source[0], source[1]);
  } else if (typeof source === 'object' && source !== null) {
    const obj = source as { x?: number; y?: number };
    if (typeof obj.x === 'number') target.x = obj.x;
    if (typeof obj.y === 'number') target.y = obj.y;
  }
}

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

/**
 * Normalizes and applies scale onto a Two.js object.
 * Protects against object assignments that would otherwise cause _matrix to produce NaN.
 */
export function applyScale(
  instance: { scale: number | Vector },
  scale: ScaleProp | undefined
): void {
  if (typeof scale === 'undefined') return;

  if (typeof scale === 'number') {
    instance.scale = scale;
  } else if (scale instanceof Two.Vector) {
    instance.scale = scale;
  } else if (Array.isArray(scale) && scale.length >= 2) {
    if (instance.scale instanceof Two.Vector) {
      instance.scale.set(scale[0], scale[1]);
    } else {
      instance.scale = new Two.Vector(scale[0], scale[1]);
    }
  } else if (typeof scale === 'object' && scale !== null) {
    const obj = scale as { x?: number; y?: number };
    const sx = typeof obj.x === 'number' ? obj.x : 1;
    const sy = typeof obj.y === 'number' ? obj.y : sx;
    if (instance.scale instanceof Two.Vector) {
      instance.scale.set(sx, sy);
    } else {
      instance.scale = new Two.Vector(sx, sy);
    }
  }
}
