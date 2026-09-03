export { Provider as Canvas } from './Provider';
export { Context, useTwo, useFrame } from './Context';
export { Group, type RefGroup, type GroupProps } from './Group';
export {
  useZUI,
  useZUIState,
  type UseZUIOptions,
  type ZUIControls,
  type ZUIState,
  type ReadonlyRef,
} from './ZUI';
export { SVG, type RefSVG, type SVGProps } from './SVG';
export { Path, type RefPath, type PathProps } from './Path';
export { Points, type RefPoints, type PointsProps } from './Points';
export { Text, type RefText, type TextProps } from './Text';

// Primitive exports
export { ArcSegment, type RefArcSegment, type ArcSegmentProps } from './ArcSegment';
export { Circle, type RefCircle, type CircleProps } from './Circle';
export { Ellipse, type RefEllipse, type EllipseProps } from './Ellipse';
export { Image, type RefImage, type ImageProps } from './Image';
export { ImageSequence, type RefImageSequence, type ImageSequenceProps } from './ImageSequence';
export { Line, type RefLine, type LineProps } from './Line';
export { Polygon, type RefPolygon, type PolygonProps } from './Polygon';
export { Rectangle, type RefRectangle, type RectangleProps } from './Rectangle';
export { RoundedRectangle, type RefRoundedRectangle, type RoundedRectangleProps } from './RoundedRectangle';
export { Sprite, type RefSprite, type SpriteProps } from './Sprite';
export { Star, type RefStar, type StarProps } from './Star';

// Gradient exports
export { LinearGradient, type RefLinearGradient, type LinearGradientProps } from './LinearGradient';
export { RadialGradient, type RefRadialGradient, type RadialGradientProps } from './RadialGradient';

// Texture exports
export { Texture, type RefTexture, type TextureProps } from './Texture';

// Lifecycle & Reconciliation exports
export { useTwoObject, useTwoGroup } from './useTwoObject';
export { TWO_DEFAULT_PROPS } from './reconciliation';

// Event exports
export type { TwoEvent, EventHandler, EventHandlers } from './Events';

// Shared property types
export type {
  ElementProps,
  ShapeProps,
  GradientProps,
  OriginProp,
  VectorProp,
  ScaleProp,
} from './Properties';
export {
  ELEMENT_PROPERTIES,
  SHAPE_PROPERTIES,
  GRADIENT_PROPERTIES,
  applyOrigin,
  applyVector,
  applyScale,
} from './Properties';

// Property matrix exports
export {
  PROPERTY_MATRIX,
  SUPPORTED_TWO_VERSION,
  type ComponentPropertyMatrix,
  type PropertyOmission,
  type OmissionCategory,
} from './propertyMatrix';


