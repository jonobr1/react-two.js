export { Provider as Canvas } from './native/Provider';
export * from './Context';
export * from './Properties';

// Re-export all shapes from the main library
// These are platform agnostic as they operate on the Two.js instance
export { ArcSegment } from './ArcSegment';
export { Circle } from './Circle';
export { Ellipse } from './Ellipse';
export { Group } from './Group';
export { Image } from './Image';
export { ImageSequence } from './ImageSequence';
export { Line } from './Line';
export { LinearGradient } from './LinearGradient';
export { Path } from './Path';
export { Points } from './Points';
export { Polygon } from './Polygon';
export { RadialGradient } from './RadialGradient';
export { Rectangle } from './Rectangle';
export { RoundedRectangle } from './RoundedRectangle';
export { Sprite } from './Sprite';
export { Star } from './Star';
export { Text } from './Text';
export { Texture } from './Texture';

// Export types
export type * from './native/types';
