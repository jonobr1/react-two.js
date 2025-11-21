import React, { useCallback, useEffect, useRef, useState } from 'react';
import Two from 'two.js';
import type { Shape } from 'two.js/src/shape';
import type { Group } from 'two.js/src/group';
import { Context, useTwo } from './Context';
import type { EventHandlers } from './Events';
import {
  createTwoEvent,
  getCanvasCoordinates,
  getParentHierarchy,
  getShapesAtPoint,
  type EventShape,
} from './Events';

type TwoConstructorProps = ConstructorParameters<typeof Two>[0];
type TwoConstructorPropsKeys = NonNullable<TwoConstructorProps>;
type ComponentProps = React.PropsWithChildren<
  TwoConstructorPropsKeys & {
    onPointerMissed?: (event: PointerEvent) => void;
  }
>;

/**
 * Validates that children are compatible with react-two.js Canvas.
 * Warns in development mode if DOM elements or incompatible components are found.
 */
function validateChildren(children: React.ReactNode): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) {
      return;
    }

    const childType = child.type;

    // Check for DOM elements (string types like 'div', 'span', etc.)
    if (typeof childType === 'string') {
      console.warn(
        `[react-two.js] <${childType}> is not compatible with Canvas.\n` +
        `Only react-two.js components (Circle, Rectangle, Group, etc.) can be used inside <Canvas>.\n` +
        `Place DOM elements outside of the Canvas component.\n` +
        `See: https://github.com/jonobr1/react-two.js#usage`
      );
      return;
    }

    // Allow React.Fragment and other built-in React elements
    if (childType === React.Fragment) {
      validateChildren(child.props.children);
      return;
    }

    // Check for function/class components - validate their children recursively
    if (typeof childType === 'function' && child.props.children) {
      validateChildren(child.props.children);
    }
  });
}

export const Provider: React.FC<ComponentProps> = (props) => {
  const { two, parent } = useTwo();
  const container = useRef<HTMLDivElement | null>(null);
  const eventShapes = useRef<Map<Shape | Group, EventShape>>(new Map());
  const hoveredShapes = useRef<Set<Shape | Group>>(new Set());
  const capturedShape = useRef<Shape | Group | null>(null);

  const [state, set] = useState<{
    two: typeof two;
    parent: typeof parent;
    width: number;
    height: number;
    registerEventShape: (
      shape: Shape | Group,
      handlers: Partial<EventHandlers>,
      parent?: Group
    ) => void;
    unregisterEventShape: (shape: Shape | Group) => void;
  }>({
    two,
    parent,
    width: 0,
    height: 0,
    registerEventShape: () => {},
    unregisterEventShape: () => {},
  });

  // Register a shape with event handlers
  const registerEventShape = useCallback(
    (
      shape: Shape | Group,
      handlers: Partial<EventHandlers>,
      parentGroup?: Group
    ) => {
      eventShapes.current.set(shape, { shape, handlers, parent: parentGroup });
    },
    []
  );

  // Unregister a shape
  const unregisterEventShape = useCallback((shape: Shape | Group) => {
    eventShapes.current.delete(shape);
    hoveredShapes.current.delete(shape);
    if (capturedShape.current === shape) {
      capturedShape.current = null;
    }
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(mount, [props]);

  function mount() {
    let unmount = () => {};
    const isRoot = !two;

    if (isRoot) {
      const args = { ...props };
      delete args.children;
      delete args.onPointerMissed;

      const two = new Two(args).appendTo(container.current!);
      let width = two.width;
      let height = two.height;

      set((prev) => ({
        ...prev,
        two,
        parent: two.scene,
        width,
        height,
        registerEventShape,
        unregisterEventShape,
      }));
      two.bind('update', update);

      unmount = () => {
        two.renderer.domElement.parentElement?.removeChild(
          two.renderer.domElement
        );
        two.unbind('update', update);
        const index = Two.Instances.indexOf(two);
        Two.Instances.splice(index, 1);
        two.pause();
      };

      function update() {
        const widthFlagged = two.width !== width;
        const heightFlagged = false;

        if (widthFlagged) {
          width = two.width;
        }
        if (heightFlagged) {
          height = two.height;
        }
        if (widthFlagged || heightFlagged) {
          set((state) => ({ ...state, width, height }));
        }
      }
    }

    return unmount;
  }

  // Validate children in development mode
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      validateChildren(props.children);
    }
  }, [props.children]);

  // Setup event listeners on canvas
  useEffect(() => {
    if (!state.two) return;

    const canvas = state.two.renderer.domElement;

    // Helper to dispatch events with bubbling
    const dispatchEvent = (
      shapes: Array<Shape | Group>,
      handlerName: keyof EventHandlers,
      nativeEvent: PointerEvent | MouseEvent | WheelEvent
    ) => {
      if (shapes.length === 0) return;

      // Get the hit shape (first in array)
      const hitShape = shapes[0];
      const point = getCanvasCoordinates(nativeEvent, canvas, state.two!);

      // Get parent hierarchy for bubbling
      const hierarchy = getParentHierarchy(hitShape, eventShapes.current);

      // Dispatch to each shape in hierarchy until stopped
      for (const currentTarget of hierarchy) {
        const entry = eventShapes.current.get(currentTarget);
        const handler = entry?.handlers[handlerName];

        if (handler) {
          const event = createTwoEvent(
            nativeEvent,
            hitShape,
            currentTarget,
            point
          );
          handler(event);

          if (event.stopped) {
            break;
          }
        }
      }
    };

    // Click handler
    const handleClick = (e: MouseEvent) => {
      const point = getCanvasCoordinates(e, canvas, state.two!);
      const shapes = getShapesAtPoint(eventShapes.current, point.x, point.y);

      if (shapes.length > 0) {
        dispatchEvent(shapes, 'onClick', e);
      }
    };

    // Context menu handler
    const handleContextMenu = (e: MouseEvent) => {
      const point = getCanvasCoordinates(e, canvas, state.two!);
      const shapes = getShapesAtPoint(eventShapes.current, point.x, point.y);

      if (shapes.length > 0) {
        dispatchEvent(shapes, 'onContextMenu', e);
      }
    };

    // Double click handler
    const handleDoubleClick = (e: MouseEvent) => {
      const point = getCanvasCoordinates(e, canvas, state.two!);
      const shapes = getShapesAtPoint(eventShapes.current, point.x, point.y);

      if (shapes.length > 0) {
        dispatchEvent(shapes, 'onDoubleClick', e);
      }
    };

    // Wheel handler
    const handleWheel = (e: WheelEvent) => {
      const point = getCanvasCoordinates(e, canvas, state.two!);
      const shapes = getShapesAtPoint(eventShapes.current, point.x, point.y);

      if (shapes.length > 0) {
        dispatchEvent(shapes, 'onWheel', e);
      }
    };

    // Pointer down handler
    const handlePointerDown = (e: PointerEvent) => {
      const point = getCanvasCoordinates(e, canvas, state.two!);
      const shapes = getShapesAtPoint(eventShapes.current, point.x, point.y);

      if (shapes.length > 0) {
        dispatchEvent(shapes, 'onPointerDown', e);

        // Support pointer capture
        if (e.target instanceof Element) {
          const hasCapture = (e.target as any).hasPointerCapture?.(e.pointerId);
          if (hasCapture) {
            capturedShape.current = shapes[0];
          }
        }
      }
    };

    // Pointer up handler
    const handlePointerUp = (e: PointerEvent) => {
      // If pointer is captured, send to captured shape
      if (capturedShape.current) {
        const entry = eventShapes.current.get(capturedShape.current);
        if (entry?.handlers.onPointerUp) {
          const point = getCanvasCoordinates(e, canvas, state.two!);
          const event = createTwoEvent(
            e,
            capturedShape.current,
            capturedShape.current,
            point
          );
          entry.handlers.onPointerUp(event);
        }
        capturedShape.current = null;
        return;
      }

      const point = getCanvasCoordinates(e, canvas, state.two!);
      const shapes = getShapesAtPoint(eventShapes.current, point.x, point.y);

      if (shapes.length > 0) {
        dispatchEvent(shapes, 'onPointerUp', e);
      } else if (props.onPointerMissed) {
        props.onPointerMissed(e);
      }
    };

    // Pointer move handler
    const handlePointerMove = (e: PointerEvent) => {
      const point = getCanvasCoordinates(e, canvas, state.two!);
      const shapes = getShapesAtPoint(eventShapes.current, point.x, point.y);
      const currentHovered = new Set(shapes);

      // Dispatch pointer move to hovered shapes
      if (shapes.length > 0) {
        dispatchEvent(shapes, 'onPointerMove', e);
      }

      // Handle pointer enter/leave
      const previousHovered = hoveredShapes.current;

      // Enter: shapes now hovered but weren't before
      for (const shape of currentHovered) {
        if (!previousHovered.has(shape)) {
          dispatchEvent([shape], 'onPointerEnter', e);
          dispatchEvent([shape], 'onPointerOver', e);
        }
      }

      // Leave: shapes previously hovered but aren't now
      for (const shape of previousHovered) {
        if (!currentHovered.has(shape)) {
          dispatchEvent([shape], 'onPointerLeave', e);
          dispatchEvent([shape], 'onPointerOut', e);
        }
      }

      hoveredShapes.current = currentHovered;
    };

    // Pointer cancel handler
    const handlePointerCancel = (e: PointerEvent) => {
      const point = getCanvasCoordinates(e, canvas, state.two!);
      const shapes = getShapesAtPoint(eventShapes.current, point.x, point.y);

      if (shapes.length > 0) {
        dispatchEvent(shapes, 'onPointerCancel', e);
      }

      capturedShape.current = null;
    };

    // Attach event listeners
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('contextmenu', handleContextMenu);
    canvas.addEventListener('dblclick', handleDoubleClick);
    canvas.addEventListener('wheel', handleWheel);
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointercancel', handlePointerCancel);

    return () => {
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('contextmenu', handleContextMenu);
      canvas.removeEventListener('dblclick', handleDoubleClick);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointercancel', handlePointerCancel);
    };
  }, [state.two, props, registerEventShape, unregisterEventShape]);

  return (
    <Context.Provider value={state}>
      <div ref={container}>{props.children}</div>
    </Context.Provider>
  );
};
