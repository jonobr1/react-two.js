import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Two from 'two.js';
import type { Shape } from 'two.js/src/shape';
import type { Group } from 'two.js/src/group';
import {
  TwoCoreContext,
  TwoParentContext,
  TwoSizeContext,
  useTwo,
} from './Context';
import type { EventHandlers } from './Events';
import {
  createTwoEvent,
  getCanvasCoordinates,
  getWorldCoordinates,
  getParentHierarchy,
  getShapesAtPoint,
  type EventShape,
} from './Events';

type TwoConstructorProps = ConstructorParameters<typeof Two>[0];
type TwoConstructorPropsKeys = NonNullable<TwoConstructorProps>;
type ComponentProps = React.PropsWithChildren<
  TwoConstructorPropsKeys & {
    onPointerMissed?: (event: PointerEvent) => void;
  } & {
    container?: React.ComponentProps<'div'>;
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
      validateChildren(
        (child.props as { children?: React.ReactNode }).children
      );
      return;
    }

    // Check for function/class components - validate their children recursively
    if (
      typeof childType === 'function' &&
      (child.props as { children?: React.ReactNode }).children
    ) {
      validateChildren(
        (child.props as { children?: React.ReactNode }).children
      );
    }
  });
}

export const Provider: React.FC<ComponentProps> = (props) => {
  const { two, parent } = useTwo();
  const container = useRef<HTMLDivElement | null>(null);
  const eventShapes = useRef<Map<Shape | Group, EventShape>>(new Map());
  const hoveredShapes = useRef<Set<Shape | Group>>(new Set());
  const capturedShape = useRef<Shape | Group | null>(null);

  const [twoState, setTwoState] = useState<typeof two>(two);
  const [parentState, setParentState] = useState<typeof parent>(parent);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);

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

  // Initialize root Two.js instance
  useEffect(() => {
    const isRoot = !two;

    if (isRoot) {
      const args = { ...props };
      delete args.children;
      // Only update root instance
      const two = new Two(args).appendTo(container.current!);

      setTwoState(two);
      setParentState(two.scene);
      setWidth(two.width);
      setHeight(two.height);

      return () => {
        two.renderer.domElement.parentElement?.removeChild(
          two.renderer.domElement
        );
        two.pause();
        two.unbind();
        two.release();
        const index = Two.Instances.indexOf(two);
        if (index >= 0) {
          Two.Instances.splice(index, 1);
        }
        two.clear();
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Update dimensions from props
  useEffect(() => {
    const isRoot = !two;

    if (isRoot) {
      // Only update root instance
      if (typeof props.width === 'number') {
        if (twoState) twoState.width = props.width;
        setWidth(props.width);
      }
      if (typeof props.height === 'number') {
        if (twoState) twoState.height = props.height;
        setHeight(props.height);
      }
    }
  }, [two, twoState, props.width, props.height]);

  // Auto-update dimensions if fullscreen / fitted
  useEffect(() => {
    const isRoot = !two;

    if (isRoot) {
      // Only update root instance
      if (twoState) {
        const instance = twoState;
        let width = instance.width;
        let height = instance.height;

        if (props.fullscreen || props.fitted) {
          instance.bind('update', update);
        }

        function update() {
          const widthFlagged = instance.width !== width;
          const heightFlagged = instance.height !== height;

          if (widthFlagged) {
            width = instance.width;
          }
          if (heightFlagged) {
            height = instance.height;
          }
          if (widthFlagged || heightFlagged) {
            setWidth(width);
            setHeight(height);
          }
        }

        return () => {
          instance.unbind('update', update);
        };
      }
    }
  }, [two, twoState, props.fullscreen, props.fitted]);

  // Validate children in development mode
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      validateChildren(props.children);
    }
  }, [props.children]);

  // Setup event listeners on canvas
  useEffect(() => {
    if (!twoState) return;

    const canvas = twoState.renderer.domElement;

    // Helper to dispatch events with bubbling
    const dispatchEvent = (
      shapes: Array<Shape | Group>,
      handlerName: keyof EventHandlers,
      nativeEvent: PointerEvent | MouseEvent | WheelEvent
    ) => {
      if (shapes.length === 0) return;

      // Get the hit shape (first in array)
      const hitShape = shapes[0];
      const point = getCanvasCoordinates(nativeEvent, canvas, twoState!);

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
      const worldPoint = getWorldCoordinates(e, canvas);
      const shapes = getShapesAtPoint(
        eventShapes.current,
        worldPoint.x,
        worldPoint.y
      );

      if (shapes.length > 0) {
        dispatchEvent(shapes, 'onClick', e);
      }
    };

    // Context menu handler
    const handleContextMenu = (e: MouseEvent) => {
      const worldPoint = getWorldCoordinates(e, canvas);
      const shapes = getShapesAtPoint(
        eventShapes.current,
        worldPoint.x,
        worldPoint.y
      );

      if (shapes.length > 0) {
        dispatchEvent(shapes, 'onContextMenu', e);
      }
    };

    // Double click handler
    const handleDoubleClick = (e: MouseEvent) => {
      const worldPoint = getWorldCoordinates(e, canvas);
      const shapes = getShapesAtPoint(
        eventShapes.current,
        worldPoint.x,
        worldPoint.y
      );

      if (shapes.length > 0) {
        dispatchEvent(shapes, 'onDoubleClick', e);
      }
    };

    // Wheel handler
    const handleWheel = (e: WheelEvent) => {
      const worldPoint = getWorldCoordinates(e, canvas);
      const shapes = getShapesAtPoint(
        eventShapes.current,
        worldPoint.x,
        worldPoint.y
      );

      if (shapes.length > 0) {
        dispatchEvent(shapes, 'onWheel', e);
      }
    };

    // Pointer down handler
    const handlePointerDown = (e: PointerEvent) => {
      const worldPoint = getWorldCoordinates(e, canvas);
      const shapes = getShapesAtPoint(
        eventShapes.current,
        worldPoint.x,
        worldPoint.y
      );

      if (shapes.length > 0) {
        dispatchEvent(shapes, 'onPointerDown', e);

        // Support pointer capture
        if (e.target instanceof Element) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
          const point = getCanvasCoordinates(e, canvas, twoState!);
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

      const worldPoint = getWorldCoordinates(e, canvas);
      const shapes = getShapesAtPoint(
        eventShapes.current,
        worldPoint.x,
        worldPoint.y
      );

      if (shapes.length > 0) {
        dispatchEvent(shapes, 'onPointerUp', e);
      } else if (props.onPointerMissed) {
        props.onPointerMissed(e);
      }
    };

    // Pointer move handler
    const handlePointerMove = (e: PointerEvent) => {
      const worldPoint = getWorldCoordinates(e, canvas);
      const shapes = getShapesAtPoint(
        eventShapes.current,
        worldPoint.x,
        worldPoint.y
      );
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
      const worldPoint = getWorldCoordinates(e, canvas);
      const shapes = getShapesAtPoint(
        eventShapes.current,
        worldPoint.x,
        worldPoint.y
      );

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    twoState,
    props.onPointerMissed,
    registerEventShape,
    unregisterEventShape,
  ]);

  const coreValue = useMemo(
    () => ({
      two: twoState,
      registerEventShape,
      unregisterEventShape,
    }),
    [twoState, registerEventShape, unregisterEventShape]
  );

  const parentValue = useMemo(
    () => ({
      parent: parentState,
    }),
    [parentState]
  );

  const sizeValue = useMemo(
    () => ({
      width,
      height,
    }),
    [width, height]
  );

  return (
    <TwoCoreContext.Provider value={coreValue}>
      <TwoParentContext.Provider value={parentValue}>
        <TwoSizeContext.Provider value={sizeValue}>
          <div ref={container} {...props.container}>
            {props.children}
          </div>
        </TwoSizeContext.Provider>
      </TwoParentContext.Provider>
    </TwoCoreContext.Provider>
  );
};
