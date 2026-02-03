import React, {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
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

// List of Two.js constructor prop keys
const TWO_CONSTRUCTOR_KEYS = [
  'fullscreen',
  'autostart',
  'width',
  'height',
  'type',
  'overdraw',
  'smoothing',
  'ratio',
] as const;

// Separate Two.js constructor-only props from DOM props
type TwoConstructorOnlyProps = {
  fullscreen?: boolean;
  autostart?: boolean;
  width?: number;
  height?: number;
  type?: (typeof Two.Types)[keyof typeof Two.Types];
  overdraw?: boolean;
  smoothing?: boolean;
  ratio?: number;
};

// Canvas element props
type CanvasElementProps = React.ComponentPropsWithoutRef<'canvas'>;

// SVG element props
type SVGElementProps = React.ComponentPropsWithoutRef<'svg'>;

// Discriminated union based on renderer type
type CanvasSpecificProps = {
  type?: 'canvas' | 'CanvasRenderer' | 'webgl' | 'WebGLRenderer';
} & CanvasElementProps;

type SVGSpecificProps = {
  type?: 'svg' | 'SVGRenderer' | never;
} & SVGElementProps;

// Final component props
type ComponentProps = React.PropsWithChildren<
  TwoConstructorOnlyProps & {
    onPointerMissed?: (event: PointerEvent) => void;
  } & (CanvasSpecificProps | SVGSpecificProps)
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
          `See: https://github.com/jonobr1/react-two.js#usage`,
      );
      return;
    }

    // Allow React.Fragment and other built-in React elements
    if (childType === React.Fragment) {
      validateChildren(
        (child.props as { children?: React.ReactNode }).children,
      );
      return;
    }

    // Check for function/class components - validate their children recursively
    if (
      typeof childType === 'function' &&
      (child.props as { children?: React.ReactNode }).children
    ) {
      validateChildren(
        (child.props as { children?: React.ReactNode }).children,
      );
    }
  });
}

export const Provider = React.forwardRef<
  HTMLCanvasElement | SVGElement,
  ComponentProps
>((props, forwardedRef) => {
  const { two, parent } = useTwo();
  const container = useRef<HTMLDivElement | null>(null);
  const eventShapes = useRef<Map<Shape | Group, EventShape>>(new Map());
  const hoveredShapes = useRef<Set<Shape | Group>>(new Set());
  const capturedShape = useRef<Shape | Group | null>(null);

  const [twoState, setTwoState] = useState<typeof two>(two);
  const [parentState, setParentState] = useState<typeof parent>(parent);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);

  // Separate Two.js constructor props from DOM element props
  const { twoProps, domProps } = useMemo(() => {
    const twoProps: Record<string, unknown> = {};
    const domProps: Record<string, unknown> = {};

    Object.keys(props).forEach((key) => {
      if (key === 'children' || key === 'onPointerMissed') {
        return; // Skip these
      }

      if (
        TWO_CONSTRUCTOR_KEYS.includes(
          key as (typeof TWO_CONSTRUCTOR_KEYS)[number],
        )
      ) {
        twoProps[key] = props[key as keyof typeof props];
      } else {
        domProps[key] = props[key as keyof typeof props];
      }
    });

    return { twoProps, domProps };
  }, [props]);

  // Forward ref to Two.js's actual DOM element
  useImperativeHandle(
    forwardedRef,
    () => twoState?.renderer.domElement as HTMLCanvasElement | SVGElement,
    [twoState],
  );

  // Register a shape with event handlers
  const registerEventShape = useCallback(
    (
      shape: Shape | Group,
      handlers: Partial<EventHandlers>,
      parentGroup?: Group,
    ) => {
      eventShapes.current.set(shape, { shape, handlers, parent: parentGroup });
    },
    [],
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

    if (isRoot && container.current && container.current.parentElement) {
      // Only update root instance
      const two = new Two(twoProps as TwoConstructorProps).appendTo(
        container.current.parentElement,
      );

      setTwoState(two);
      setParentState(two.scene);
      setWidth(two.width);
      setHeight(two.height);

      return () => {
        two.renderer.domElement.parentElement?.removeChild(
          two.renderer.domElement,
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
      nativeEvent: PointerEvent | MouseEvent | WheelEvent,
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
            point,
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
        worldPoint.y,
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
        worldPoint.y,
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
        worldPoint.y,
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
        worldPoint.y,
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
        worldPoint.y,
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
            point,
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
        worldPoint.y,
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
        worldPoint.y,
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
        worldPoint.y,
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

  // Apply DOM props to Two.js's actual canvas/SVG element
  useLayoutEffect(() => {
    if (!twoState) return;

    // Skip if in fullscreen mode - Two.js manages styles
    if (props.fullscreen) {
      const resize = () => {
        setWidth(twoState.width);
        setHeight(twoState.height);
      };
      twoState.bind('resize', resize);
      return () => {
        twoState.unbind('resize', resize);
      };
    }

    const element = twoState.renderer.domElement;

    // Apply each DOM prop to the element
    Object.entries(domProps).forEach(([key, value]) => {
      if (value === undefined) return;

      if (key === 'style' && typeof value === 'object') {
        // Merge style object
        Object.assign(element.style, value);
      } else if (key === 'className') {
        element.className = value as string;
      } else if (key.startsWith('on') && typeof value === 'function') {
        // Handle React event props (onClick, onMouseMove, etc.)
        const eventName = key.slice(2).toLowerCase();
        element.addEventListener(eventName, value as EventListener);
      } else if (key.startsWith('aria-') || key.startsWith('data-')) {
        // Set as attribute for aria-* and data-* props
        element.setAttribute(key, String(value));
      } else if (key in element) {
        // Set as property if it exists on the element
        const elementWithKey = element as Record<string, unknown>;
        elementWithKey[key] = value;
      } else {
        // Fallback to setAttribute
        element.setAttribute(key, String(value));
      }
    });

    // Cleanup event listeners
    return () => {
      Object.entries(domProps).forEach(([key, value]) => {
        if (key.startsWith('on') && typeof value === 'function') {
          const eventName = key.slice(2).toLowerCase();
          element.removeEventListener(eventName, value as EventListener);
        }
      });
    };
  }, [twoState, domProps, props.fullscreen]);

  const coreValue = useMemo(
    () => ({
      two: twoState,
      registerEventShape,
      unregisterEventShape,
    }),
    [twoState, registerEventShape, unregisterEventShape],
  );

  const parentValue = useMemo(
    () => ({
      parent: parentState,
    }),
    [parentState],
  );

  const sizeValue = useMemo(
    () => ({
      width,
      height,
    }),
    [width, height],
  );

  return (
    <TwoCoreContext.Provider value={coreValue}>
      <TwoParentContext.Provider value={parentValue}>
        <TwoSizeContext.Provider value={sizeValue}>
          <div ref={container} style={{ display: 'none' }}>
            {props.children}
          </div>
        </TwoSizeContext.Provider>
      </TwoParentContext.Provider>
    </TwoCoreContext.Provider>
  );
});

Provider.displayName = 'Canvas';
