export type CanvasToolId =
  | 'select'
  | 'hand'
  | 'rectangle'
  | 'ellipse'
  | 'arrow'
  | 'line'
  | 'pen'
  | 'text'
  | 'sticky'
  | 'frame';

export type CanvasDashStyle = 'solid' | 'dashed' | 'dotted';

export interface CanvasPoint {
  x: number;
  y: number;
}

export interface CanvasCamera {
  x: number;
  y: number;
  z: number;
}

export interface CanvasViewport {
  width: number;
  height: number;
}

export interface CanvasBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasStyle {
  fill: string;
  stroke: string;
  strokeWidth: number;
  opacity: number;
  fontSize: number;
  fontFamily: string;
  dash: CanvasDashStyle;
}

interface BaseShape<TType extends string> {
  id: string;
  type: TType;
  x: number;
  y: number;
  rotation: number;
  opacity: number;
  parentId: string | null;
}

export interface RectangleShapeRecord extends BaseShape<'rectangle'> {
  width: number;
  height: number;
  radius: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  dash: CanvasDashStyle;
}

export interface EllipseShapeRecord extends BaseShape<'ellipse'> {
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  dash: CanvasDashStyle;
}

export interface ArrowShapeRecord extends BaseShape<'arrow'> {
  x2: number;
  y2: number;
  stroke: string;
  strokeWidth: number;
  dash: CanvasDashStyle;
}

export interface LineShapeRecord extends BaseShape<'line'> {
  points: CanvasPoint[];
  stroke: string;
  strokeWidth: number;
  dash: CanvasDashStyle;
}

export interface PathShapeRecord extends BaseShape<'path'> {
  points: CanvasPoint[];
  stroke: string;
  strokeWidth: number;
  dash: CanvasDashStyle;
}

export interface TextShapeRecord extends BaseShape<'text'> {
  text: string;
  width: number;
  height: number;
  fill: string;
  fontSize: number;
  fontFamily: string;
  align: 'left' | 'center' | 'right';
}

export interface StickyShapeRecord extends BaseShape<'sticky'> {
  text: string;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  fontSize: number;
  fontFamily: string;
}

export interface FrameShapeRecord extends BaseShape<'frame'> {
  label: string;
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  fontSize: number;
  fontFamily: string;
}

export type CanvasShapeRecord =
  | RectangleShapeRecord
  | EllipseShapeRecord
  | ArrowShapeRecord
  | LineShapeRecord
  | PathShapeRecord
  | TextShapeRecord
  | StickyShapeRecord
  | FrameShapeRecord;

export interface CanvasDocument {
  shapes: CanvasShapeRecord[];
}
