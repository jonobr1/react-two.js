import Two from 'two.js';
import type { Shape } from 'two.js/src/shape';
import type { Group } from 'two.js/src/group';

export interface TwoEvent<T extends Shape | Group = Shape | Group> {
  nativeEvent: PointerEvent | MouseEvent | WheelEvent;
  target: T;
  currentTarget: T;
  point: { x: number; y: number };
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

/**
 * Convert DOM event coordinates to canvas-relative coordinates (center origin)
 */
export function getCanvasCoordinates(
  nativeEvent: PointerEvent | MouseEvent | WheelEvent,
  canvas: HTMLElement,
  two: Two
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();

  // Convert from DOM space (top-left origin) to Two.js space (center origin)
  const x = nativeEvent.clientX - rect.left - two.width / 2;
  const y = nativeEvent.clientY - rect.top - two.height / 2;

  return { x, y };
}

/**
 * Convert raw client coordinates to world-space coordinates for hit testing.
 * World space uses a top-left origin, relative to the canvas element.
 */
export function clientToWorldPoint(
  clientX: number,
  clientY: number,
  canvas: HTMLElement
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();

  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}

/**
 * Convert DOM event coordinates to world-space coordinates for hit testing
 * World-space uses top-left origin (same as DOM but relative to canvas)
 */
export function getWorldCoordinates(
  nativeEvent: PointerEvent | MouseEvent,
  canvas: HTMLElement
): { x: number; y: number } {
  return clientToWorldPoint(nativeEvent.clientX, nativeEvent.clientY, canvas);
}

/**
 * Create a TwoEvent object from a DOM event
 */
export function createTwoEvent<T extends Shape | Group>(
  nativeEvent: PointerEvent | MouseEvent | WheelEvent,
  target: T,
  currentTarget: T,
  point: { x: number; y: number }
): TwoEvent<T> {
  let stopped = false;

  return {
    nativeEvent,
    target,
    currentTarget,
    point,
    stopPropagation: () => {
      stopped = true;
    },
    get stopped() {
      return stopped;
    },
  };
}

/**
 * Check if a shape contains a point using Two.js hit testing
 */
export function hitTest(shape: Shape | Group, x: number, y: number, two?: Two | null): boolean {
  // Check if shape is visible
  if ('visible' in shape && !shape.visible) {
    return false;
  }

  // Use shape.contains if custom contains function exists.
  // DOM nodes also expose a `contains`, with completely different semantics,
  // so exclude those. The globals are guarded because this module must not
  // throw when evaluated outside a DOM runtime.
  const candidateShape = shape as unknown as { contains?: unknown };
  const isDomContains =
    (typeof Node !== 'undefined' &&
      candidateShape.contains === Node.prototype.contains) ||
    (typeof Element !== 'undefined' &&
      candidateShape.contains === Element.prototype.contains);
  if (typeof candidateShape.contains === 'function' && !isDomContains) {
    return (candidateShape.contains as (x: number, y: number) => boolean)(x, y);
  }

  // Use Two.js getBoundingClientRect API
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (typeof (shape as any).getBoundingClientRect === 'function') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rect = (shape as any).getBoundingClientRect(false);
      if (rect && typeof rect.left === 'number' && typeof rect.right === 'number') {
        const isRealTwoShape = 'worldMatrix' in shape || '_matrix' in shape;
        const offsetX = (!isRealTwoShape && two) ? two.width / 2 : 0;
        const offsetY = (!isRealTwoShape && two) ? two.height / 2 : 0;
        const left = rect.left + offsetX;
        const right = rect.right + offsetX;
        const top = rect.top + offsetY;
        const bottom = rect.bottom + offsetY;

        if (x >= left && x <= right && y >= top && y <= bottom) {
          return true;
        }
      }
    } catch {
      // Fallback to checking children if getBoundingClientRect fails
    }
  }

  // For Groups without bounds, recursively check children
  if ('children' in shape && Array.isArray((shape as Group).children)) {
    for (const child of (shape as Group).children) {
      if (hitTest(child, x, y, two)) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Sort shapes front-to-back (topmost visible shape first).
 * In 2D rendering, shapes drawn later (or with higher parent.children index) sit on top of shapes drawn earlier.
 */
export function sortFrontToBack(
  hits: Array<Shape | Group>,
  shapes: Map<Shape | Group, EventShape>
): Array<Shape | Group> {
  if (hits.length <= 1) return hits;

  const keys = Array.from(shapes.keys());

  return [...hits].sort((a, b) => {
    const entryA = shapes.get(a);
    const entryB = shapes.get(b);

    // If both belong to the same parent Group, compare their index in parent.children
    if (entryA?.parent && entryB?.parent && entryA.parent === entryB.parent) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const parentChildren = (entryA.parent as any).children;
      if (parentChildren && typeof parentChildren.indexOf === 'function') {
        const indexA = parentChildren.indexOf(a);
        const indexB = parentChildren.indexOf(b);
        if (indexA !== -1 && indexB !== -1) {
          return indexB - indexA; // Higher index = drawn on top = should be first
        }
      }
    }

    // Default: reverse registration order (shapes registered later sit on top)
    const indexA = keys.indexOf(a);
    const indexB = keys.indexOf(b);
    return indexB - indexA; // Higher registration index = frontmost
  });
}

/**
 * Get all shapes at a point, sorted by depth (front to back)
 * Uses scene graph traversal and registration order to maintain z-order
 */
export function getShapesAtPoint(
  shapes: Map<Shape | Group, EventShape>,
  x: number,
  y: number,
  two?: Two | null
): Array<Shape | Group> {
  if (two?.scene) {
    (two.scene as unknown as { _update: (deep?: boolean) => void })._update(true);
  }

  const hits: Array<Shape | Group> = [];

  for (const [shape] of shapes) {
    if (hitTest(shape, x, y, two)) {
      hits.push(shape);
    }
  }

  return sortFrontToBack(hits, shapes);
}

/**
 * Get the parent hierarchy for event bubbling
 */
export function getParentHierarchy(
  shape: Shape | Group,
  shapes: Map<Shape | Group, EventShape>
): Array<Shape | Group> {
  const hierarchy: Array<Shape | Group> = [shape];

  // Walk up the parent chain
  const entry = shapes.get(shape);
  if (entry?.parent) {
    let currentParent: Group | undefined = entry.parent;

    while (currentParent) {
      hierarchy.push(currentParent);
      const parentEntry = shapes.get(currentParent);
      currentParent = parentEntry?.parent;
    }
  }

  return hierarchy;
}
