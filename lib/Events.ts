/**
 * Event system for react-two.js
 * Implements R3F-style event handlers using Two.js hit testing
 */

import Two from 'two.js';
import type { Shape } from 'two.js/src/shape';
import type { Group } from 'two.js/src/group';

/**
 * Event object passed to event handlers
 * Similar to React Three Fiber's ThreeEvent
 */
export interface TwoEvent<T = Shape> {
  /** The original DOM event */
  nativeEvent: PointerEvent | MouseEvent | WheelEvent;
  /** The shape that was directly hit */
  target: T;
  /** The shape that has the event handler (may be ancestor due to bubbling) */
  currentTarget: T;
  /** The point in Two.js coordinate space (center origin) */
  point: { x: number; y: number };
  /** Stop event from bubbling to parent groups */
  stopPropagation: () => void;
  /** Whether propagation was stopped */
  stopped: boolean;
}

/**
 * Event handler function type
 */
export type EventHandler<T = Shape> = (event: TwoEvent<T>) => void;

/**
 * All supported event handlers (matching R3F API)
 */
export interface EventHandlers {
  onClick?: EventHandler;
  onContextMenu?: EventHandler;
  onDoubleClick?: EventHandler;
  onWheel?: EventHandler;
  onPointerDown?: EventHandler;
  onPointerUp?: EventHandler;
  onPointerOver?: EventHandler;
  onPointerOut?: EventHandler;
  onPointerEnter?: EventHandler;
  onPointerLeave?: EventHandler;
  onPointerMove?: EventHandler;
  onPointerCancel?: EventHandler;
}

/**
 * Event handler names for iteration
 */
export const EVENT_HANDLER_NAMES = [
  'onClick',
  'onContextMenu',
  'onDoubleClick',
  'onWheel',
  'onPointerDown',
  'onPointerUp',
  'onPointerOver',
  'onPointerOut',
  'onPointerEnter',
  'onPointerLeave',
  'onPointerMove',
  'onPointerCancel',
] as const;

/**
 * Shape registration entry for event system
 */
export interface EventShape {
  shape: Shape | Group;
  handlers: Partial<EventHandlers>;
  parent?: Group;
}

/**
 * Convert DOM event coordinates to Two.js coordinate space
 * Two.js uses center origin (0,0 at center of canvas)
 */
export function getCanvasCoordinates(
  nativeEvent: PointerEvent | MouseEvent,
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
 * Convert DOM event coordinates to world-space coordinates for hit testing
 * World-space uses top-left origin (same as DOM but relative to canvas)
 */
export function getWorldCoordinates(
  nativeEvent: PointerEvent | MouseEvent,
  canvas: HTMLElement
): { x: number; y: number } {
  const rect = canvas.getBoundingClientRect();

  // Convert from DOM space to canvas-relative space (both top-left origin)
  const x = nativeEvent.clientX - rect.left;
  const y = nativeEvent.clientY - rect.top;

  return { x, y };
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
export function hitTest(shape: Shape | Group, x: number, y: number): boolean {
  // Check if shape is visible
  if ('visible' in shape && !shape.visible) {
    return false;
  }

  // Use Two.js hit testing API
  if (typeof shape.contains === 'function') {
    return shape.contains(x, y);
  }

  // Fallback for shapes without hit testing
  return false;
}

/**
 * Get all shapes at a point, sorted by depth (front to back)
 * Uses scene graph traversal to maintain z-order
 */
export function getShapesAtPoint(
  shapes: Map<Shape | Group, EventShape>,
  x: number,
  y: number
): Array<Shape | Group> {
  const hits: Array<Shape | Group> = [];

  for (const [shape] of shapes) {
    if (hitTest(shape, x, y)) {
      hits.push(shape);
    }
  }

  // TODO: Sort by z-order/drawing order when Two.js provides this info
  // For now, return in registration order
  return hits;
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
