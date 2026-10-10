import Two from 'two.js';
import type { Shape } from 'two.js/src/shape';
import type { Group } from 'two.js/src/group';

export interface TwoEvent<T extends Shape | Group = Shape | Group> {
  nativeEvent: PointerEvent | MouseEvent | WheelEvent;
  target: T;
  currentTarget: T;
  point: { x: number; y: number };
  /** Capture this pointer for currentTarget until release, up, or cancel. */
  setPointerCapture: (pointerId: number) => void;
  releasePointerCapture: (pointerId: number) => void;
  hasPointerCapture: (pointerId: number) => boolean;
  stopPropagation: () => void;
  readonly stopped: boolean;
}

export type EventHandler<T extends Shape | Group = Shape | Group> = (
  event: TwoEvent<T>
) => void;

export interface EventHandlers {
  onClick?: EventHandler;
  onContextMenu?: EventHandler;
  onDoubleClick?: EventHandler;
  onPointerDown?: EventHandler;
  onPointerMove?: EventHandler;
  onPointerUp?: EventHandler;
  onPointerOver?: EventHandler;
  onPointerOut?: EventHandler;
  onPointerEnter?: EventHandler;
  onPointerLeave?: EventHandler;
  onPointerCancel?: EventHandler;
  onWheel?: EventHandler;
}

export const EVENT_HANDLER_NAMES: Array<keyof EventHandlers> = [
  'onClick',
  'onContextMenu',
  'onDoubleClick',
  'onPointerDown',
  'onPointerMove',
  'onPointerUp',
  'onPointerOver',
  'onPointerOut',
  'onPointerEnter',
  'onPointerLeave',
  'onPointerCancel',
  'onWheel',
];

export interface EventShape {
  shape: Shape | Group;
  handlers: Partial<EventHandlers>;
  parent?: Group;
}

/** Renderer world coordinates, in logical pixels from the top-left origin. */
export function clientToWorldPoint(
  clientX: number,
  clientY: number,
  canvas: HTMLElement,
  two?: Two | null,
): { x: number; y: number } {
  // SVG viewport sizing does not scale its contents unless a viewBox (or CSS
  // transform) does so. Its screen CTM also accounts for preserveAspectRatio.
  const svg = canvas as HTMLElement & { getScreenCTM?: () => DOMMatrix | null };
  const screen = svg.getScreenCTM?.();
  if (screen) {
    const inverse = screen.inverse();
    return {
      x: inverse.a * clientX + inverse.c * clientY + inverse.e,
      y: inverse.b * clientX + inverse.d * clientY + inverse.f,
    };
  }
  const rect = canvas.getBoundingClientRect();
  return {
    x: (clientX - rect.left) * (two && rect.width > 0 ? two.width / rect.width : 1),
    y: (clientY - rect.top) * (two && rect.height > 0 ? two.height / rect.height : 1),
  };
}

export function getCanvasCoordinates(
  event: PointerEvent | MouseEvent | WheelEvent,
  canvas: HTMLElement,
  two: Two,
): { x: number; y: number } {
  return clientToWorldPoint(event.clientX, event.clientY, canvas, two);
}

export function getWorldCoordinates(
  event: PointerEvent | MouseEvent | WheelEvent,
  canvas: HTMLElement,
  two?: Two | null,
): { x: number; y: number } {
  return clientToWorldPoint(event.clientX, event.clientY, canvas, two);
}

export interface PointerCaptureControls {
  setPointerCapture: (pointerId: number) => void;
  releasePointerCapture: (pointerId: number) => void;
  hasPointerCapture: (pointerId: number) => boolean;
}

/**
 * Create a TwoEvent object from a DOM event
 */
export function createTwoEvent<T extends Shape | Group>(
  nativeEvent: PointerEvent | MouseEvent | WheelEvent,
  target: T,
  currentTarget: T,
  point: { x: number; y: number },
  capture?: PointerCaptureControls,
): TwoEvent<T> {
  let stopped = false;

  return {
    nativeEvent,
    target,
    currentTarget,
    point,
    setPointerCapture: (id) => capture?.setPointerCapture(id),
    releasePointerCapture: (id) => capture?.releasePointerCapture(id),
    hasPointerCapture: (id) => capture?.hasPointerCapture(id) ?? false,
    stopPropagation: () => {
      stopped = true;
    },
    get stopped() {
      return stopped;
    },
  };
}

/** Test leaf geometry; groups are the union of their descendants. */
export function hitTest(shape: Shape | Group, x: number, y: number): boolean {
  if ('visible' in shape && !shape.visible) return false;
  if ('opacity' in shape && (shape as Group).opacity <= 0) return false;
  if ('children' in shape) {
    return Array.from((shape as Group).children).some((child) => hitTest(child, x, y));
  }
  const candidate = shape as Shape & { contains?: (x: number, y: number) => boolean };
  if (typeof candidate.contains === 'function') return candidate.contains(x, y);
  const rect = (shape as Shape & { getBoundingClientRect?: () => DOMRect }).getBoundingClientRect?.();
  return !!rect && x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

/** Walk the actual scene ancestry, including groups without handlers. */
export function getParentHierarchy(
  shape: Shape | Group,
  shapes: Map<Shape | Group, EventShape>,
): Array<Shape | Group> {
  const hierarchy: Array<Shape | Group> = [];
  const visited = new Set<Shape | Group>();
  let current: Shape | Group | undefined = shape;
  while (current && !visited.has(current)) {
    visited.add(current);
    hierarchy.push(current);
    current = (current as Shape & { parent?: Group }).parent ?? shapes.get(current)?.parent;
  }
  return hierarchy;
}

/** Compare complete scene paths, including nested and reordered groups. */
export function sortFrontToBack(
  hits: Array<Shape | Group>,
  shapes: Map<Shape | Group, EventShape>,
): Array<Shape | Group> {
  return [...hits].sort((a, b) => {
    const pathA = getParentHierarchy(a, shapes).reverse();
    const pathB = getParentHierarchy(b, shapes).reverse();
    let i = 0;
    while (i < pathA.length && i < pathB.length && pathA[i] === pathB[i]) i++;
    if (i > 0 && i < pathA.length && i < pathB.length) {
      const siblings = (pathA[i - 1] as Group).children;
      return siblings.indexOf(pathB[i]) - siblings.indexOf(pathA[i]);
    }
    if (i > 0) return pathB.length - pathA.length;
    return 0;
  });
}

function passesMasks(shape: Shape | Group, x: number, y: number): boolean {
  let current: Shape | Group | undefined = shape;
  while (current) {
    const owner = current as Shape & { mask?: Shape | Group; clip?: boolean };
    if (owner.clip) return false;
    if (owner.mask) {
      // Masks are rendered in their owner's local space, even if unattached.
      const inverse = owner.worldMatrix.inverse();
      if (!inverse) return false;
      const local = inverse.multiply(x, y, 1);
      const maskParent = (owner.mask as Shape & { parent?: Group }).parent;
      const point = maskParent?.worldMatrix.multiply(local[0], local[1], 1) ?? local;
      if (!maskContains(owner.mask, point[0], point[1])) return false;
    }
    current = (current as Shape & { parent?: Group }).parent;
  }
  return true;
}

function maskContains(mask: Shape | Group, x: number, y: number): boolean {
  if ('children' in mask) {
    return Array.from((mask as Group).children).some((child) => maskContains(child, x, y));
  }
  const geometry = mask as Shape & {
    contains: (x: number, y: number, options: Record<string, unknown>) => boolean;
  };
  return geometry.contains(x, y, { ignoreVisibility: true, fill: true, stroke: false });
}

function hasPaint(shape: Shape | Group): boolean {
  if (!('fill' in shape) && !('stroke' in shape)) return true;
  const painted = shape as Shape & { fill?: unknown; stroke?: unknown; linewidth?: number };
  const visiblePaint = (paint: unknown) => !!paint &&
    (typeof paint !== 'string' || !/^(none|transparent)$/i.test(paint));
  return visiblePaint(painted.fill) || ((painted.linewidth ?? 1) > 0 && visiblePaint(painted.stroke));
}

/** Two.js traversal supplies authoritative draw order; groups never use bounds. */
export function getShapesAtPoint(
  shapes: Map<Shape | Group, EventShape>,
  x: number,
  y: number,
  two?: Two | null,
): Array<Shape | Group> {
  if (two?.scene) {
    (two.scene as unknown as { _update: (deep?: boolean) => void })._update(true);
    const scene = two.scene as Group & {
      getShapesAtPoint: (x: number, y: number) => Array<Shape | Group>;
    };
    return Array.from(scene.getShapesAtPoint(x, y)).filter((shape) =>
      hasPaint(shape) && passesMasks(shape, x, y) &&
      getParentHierarchy(shape, shapes).some((parent) => shapes.has(parent)));
  }
  return sortFrontToBack(Array.from(shapes.keys()).filter((shape) => hitTest(shape, x, y)), shapes);
}
