declare module 'two.js/extras/jsm/zui.js' {
  import { Group } from 'two.js/src/group';
  import { Matrix } from 'two.js/src/matrix';

  export class ZUI {
    limits: {
      scale: { min: number; max: number };
      x: { min: number; max: number };
      y: { min: number; max: number };
    };
    viewport: HTMLElement;
    viewportOffset: {
      top: number;
      left: number;
      matrix: Matrix;
    };
    surfaceMatrix: Matrix;
    surfaces: Surface[];
    zoom: number;
    scale: number;

    constructor(group: Group, domElement?: HTMLElement);

    add(surface: Surface): this;
    addLimits(min?: number, max?: number): this;
    clientToSurface(x: number, y: number, z?: number): { x: number; y: number; z: number };
    clientToSurface(v: { x?: number; y?: number; z?: number }): { x: number; y: number; z: number };
    surfaceToClient(x: number, y: number, z?: number): { x: number; y: number; z: number };
    surfaceToClient(v: { x?: number; y?: number; z?: number }): { x: number; y: number; z: number };
    zoomBy(byF: number, clientX: number, clientY: number): this;
    zoomSet(zoom: number, clientX: number, clientY: number): this;
    translateSurface(x: number, y: number): this;
    updateOffset(): this;
    updateSurface(): this;
    reset(): this;
    fitToLimits(s: number): number;

    static Surface: typeof Surface;
    static Clamp(v: number, min: number, max: number): number;
    static Limit: {
      min: number;
      max: number;
      clone(): { min: number; max: number };
    };
    static TranslateMatrix(m: Matrix, x: number, y: number): Matrix;
    static PositionToScale(pos: number): number;
    static ScaleToPosition(scale: number): number;
  }

  export class Surface {
    object: Group;
    min?: number;
    max?: number;

    constructor(object: Group);
    limits(min?: number, max?: number): { min?: number; max?: number } | this;
    apply(px: number, py: number, s: number): this;
  }
}
