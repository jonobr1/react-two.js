/**
 * Local, non-ambient types for `two.js/extras/jsm/zui.js`, which ships no
 * declarations. Declaring this as an ambient module would leak into every
 * consumer of react-two.js, so we type it structurally and cast at the
 * single import site in `lib/ZUI.ts`.
 */
import type { Group } from 'two.js/src/group';
import type { Matrix } from 'two.js/src/matrix';

export interface ZUIVector {
  x: number;
  y: number;
  z: number;
}

export interface ZUIInstance {
  zoom: number;
  scale: number;
  surfaceMatrix: Matrix;
  viewport: HTMLElement;
  limits: {
    scale: { min: number; max: number };
    x: { min: number; max: number };
    y: { min: number; max: number };
  };
  addLimits(min?: number, max?: number): ZUIInstance;
  zoomBy(byF: number, clientX: number, clientY: number): ZUIInstance;
  zoomSet(zoom: number, clientX: number, clientY: number): ZUIInstance;
  translateSurface(x: number, y: number): ZUIInstance;
  clientToSurface(x: number, y: number, z?: number): ZUIVector;
  surfaceToClient(x: number, y: number, z?: number): ZUIVector;
  updateOffset(): ZUIInstance;
  updateSurface(): ZUIInstance;
  reset(): ZUIInstance;
}

export type ZUIConstructor = new (
  group: Group,
  domElement?: HTMLElement
) => ZUIInstance;
