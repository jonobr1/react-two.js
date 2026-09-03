// Re-export event handler types for convenience
export type { EventHandlers, EventHandler, TwoEvent } from './Events';

export type ElementProps = 'renderer' | 'id' | 'className';
export type ShapeProps =
  | ElementProps
  | 'position'
  | 'translation'
  | 'rotation'
  | 'scale'
  | 'skewX'
  | 'skewY'
  | 'matrix'
  | 'worldMatrix';
export type GradientProps = ElementProps | 'spread' | 'units' | 'stops';

export const ELEMENT_PROPERTIES = ['renderer', 'id', 'className'] as const;
export const SHAPE_PROPERTIES = [
  'position',
  'translation',
  'rotation',
  'scale',
  'skewX',
  'skewY',
  'matrix',
  'worldMatrix',
] as const;
export const GRADIENT_PROPERTIES = ['spread', 'units', 'stops'] as const;

