export type ElementProps = 'renderer' | 'id' | 'className';
export type ShapeProps =
  | ElementProps
  | 'position'
  | 'rotation'
  | 'scale'
  | 'skewX'
  | 'skewY'
  | 'matrix'
  | 'worldMatrix';
export type GradientProps = ElementProps | 'spread' | 'units' | 'stops';
