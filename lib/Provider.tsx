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
  ChildSlotContext,
  TwoCoreContext,
  TwoParentContext,
  TwoSizeContext,
  useTwo,
  type TwoParentContextValue,
} from './Context';
import { reconcileSceneOrder } from './reconciliation';
import type { EventHandlers } from './Events';
import {
  clientToWorldPoint,
  createTwoEvent,
  getCanvasCoordinates,
  getParentHierarchy,
  getShapesAtPoint,
  type EventShape,
} from './Events';

type TwoConstructorProps = ConstructorParameters<typeof Two>[0];

function normalizeRenderer(type: unknown): string {
  switch (type) {
    case 'canvas': return Two.Types.canvas;
    case 'webgl': return Two.Types.webgl;
    case 'svg':
    case undefined: return Two.Types.svg;
    default: return type as string;
  }
}

function isProduction(): boolean {
  return (import.meta as ImportMeta & { env?: { PROD?: boolean } }).env?.PROD === true ||
    (globalThis as { process?: { env?: { NODE_ENV?: string } } }).process?.env?.NODE_ENV === 'production';
}

const IMMUTABLE_OPTIONS = ['type', 'fullscreen', 'ratio', 'overdraw', 'smoothing'] as const;
const FULLSCREEN_BODY_STYLES = ['overflow', 'margin', 'padding', 'top', 'left', 'right', 'bottom', 'position'] as const;

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
  type?: 'canvas' | 'CanvasRenderer' | 'svg' | 'SVGRenderer' | 'webgl' | 'WebGLRenderer';
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
  if (isProduction()) {
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
  const rendererElement = useRef<HTMLElement | null>(null);
  const hoveredShapes = useRef<Set<Shape | Group>>(new Set());
  const capturedShapes = useRef<Map<number, Shape | Group>>(new Map());
  const pointerDowns = useRef<Map<number, { missed: boolean; captured: boolean }>>(new Map());
  const hoverTarget = useRef<Shape | Group | null>(null);
  const childrenOrderRef = useRef<Array<Shape | Group>>([]);
  const attachedChildrenRef = useRef<Set<Shape | Group>>(new Set());
  const constructorOptions = useRef<Record<string, unknown> | null>(null);
  const previousOptions = useRef<Record<string, unknown>>({});
  const onPointerMissed = props.onPointerMissed;

  const [twoState, setTwoState] = useState<typeof two>(two);
  const [parentState, setParentState] = useState<typeof parent>(parent);
  const [width, setWidth] = useState<number>(0);
  const [height, setHeight] = useState<number>(0);

  const attachChild = useCallback((child: Shape | Group) => {
    attachedChildrenRef.current.add(child);
    parentState?.add(child);
  }, [parentState]);

  const detachChild = useCallback((child: Shape | Group) => {
    attachedChildrenRef.current.delete(child);
    parentState?.remove(child);
  }, [parentState]);

  const registerChildOrder = useCallback((child: Shape | Group) => {
    childrenOrderRef.current.push(child);
  }, []);

  useLayoutEffect(() => {
    if (parentState && childrenOrderRef.current.length > 0) {
      reconcileSceneOrder(parentState, childrenOrderRef.current);
      childrenOrderRef.current = [];
    }
  });

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

    twoProps.type = normalizeRenderer(twoProps.type);
    twoProps.fullscreen = twoProps.fullscreen ?? false;
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
    for (const [id, captured] of capturedShapes.current) {
      if (captured === shape) {
        capturedShapes.current.delete(id);
        const element = rendererElement.current;
        if (element?.hasPointerCapture?.(id)) element.releasePointerCapture(id);
      }
    }
  }, []);

  /**
   * Returns true if any registered event shape sits under the given client
   * coordinates. Used by `useZUI` to leave pointerdowns that landed on a
   * shape alone, so shape drags and canvas panning never fight.
   */
  const hitTestPoint = useCallback(
    (clientX: number, clientY: number): boolean => {
      const canvas = twoState?.renderer.domElement;
      if (!canvas) return false;

      const point = clientToWorldPoint(clientX, clientY, canvas, twoState);
      return (
        getShapesAtPoint(eventShapes.current, point.x, point.y, twoState)
          .length > 0
      );
    },
    [twoState],
  );

  // Initialize root Two.js instance
  useEffect(() => {
    const isRoot = !two;

    if (isRoot && container.current && container.current.parentElement) {
      const bodyStyles = twoProps.fullscreen
        ? FULLSCREEN_BODY_STYLES.map((key) => [key, document.body.style[key]] as const)
        : [];
      // Only update root instance
      const two = new Two(twoProps as TwoConstructorProps).appendTo(
        container.current.parentElement,
      );
      constructorOptions.current = { ...twoProps };
      previousOptions.current = { ...twoProps };
      rendererElement.current = two.renderer.domElement;

      setTwoState(two);
      setParentState(two.scene);
      setWidth(two.width);
      setHeight(two.height);

      const shapes = eventShapes.current;
      const hovered = hoveredShapes.current;
      const attached = attachedChildrenRef.current;
      const captures = capturedShapes.current;
      const downs = pointerDowns.current;
      const fullscreenStyles = bodyStyles.map(([key]) => document.body.style[key]);

      return () => {
        two.renderer.domElement.parentElement?.removeChild(
          two.renderer.domElement,
        );
        two.pause();
        const fit = two.fit as (() => void) & { attached?: boolean; domElement?: EventTarget };
        if (fit?.attached) {
          fit.domElement?.removeEventListener('resize', fit);
          fit.attached = false;
        }
        bodyStyles.forEach(([key, value], index) => {
          if (document.body.style[key] === fullscreenStyles[index]) document.body.style[key] = value;
        });
        two.unbind();
        two.release();
        const index = Two.Instances.indexOf(two);
        if (index >= 0) {
          Two.Instances.splice(index, 1);
        }
        two.clear();
        shapes.clear();
        hovered.clear();
        captures.clear();
        downs.clear();
        rendererElement.current = null;
        hoverTarget.current = null;
        attached.clear();
        childrenOrderRef.current = [];
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Constructor options are fixed for this mount; a React key opts into recreation.
  useEffect(() => {
    if (two || !twoState || !constructorOptions.current) return;
    if (!isProduction()) {
      for (const key of IMMUTABLE_OPTIONS) {
        if (twoProps[key] !== constructorOptions.current[key] && twoProps[key] !== previousOptions.current[key]) {
          console.warn(`[react-two.js] Canvas "${key}" is a constructor option. Change the Canvas key to apply it.`);
        }
      }
    }
    previousOptions.current = { ...twoProps };
  }, [two, twoState, twoProps]);

  useEffect(() => {
    if (two || !twoState) return;
    if (props.autostart) twoState.play();
    else twoState.pause();
  }, [two, twoState, props.autostart]);

  // Update dimensions from props
  useEffect(() => {
    const isRoot = !two;

    if (isRoot) {
      // Only update root instance
      let sizeChanged = false;
      if (typeof props.width === 'number') {
        if (twoState && twoState.width !== props.width) {
          twoState.width = props.width;
          sizeChanged = true;
        }
        setWidth(props.width);
      }
      if (typeof props.height === 'number') {
        if (twoState && twoState.height !== props.height) {
          twoState.height = props.height;
          sizeChanged = true;
        }
        setHeight(props.height);
      }
      if (twoState && sizeChanged) {
        twoState.renderer.setSize(
          twoState.width,
          twoState.height,
          (twoState.renderer as { ratio?: number }).ratio,
        );
        if (!twoState.playing) {
          twoState.render();
        }
      }
    }
  }, [two, twoState, props.width, props.height]);

  // Validate children in development mode.
  // `validateChildren` already no-ops in production, so no guard is needed
  // here — gating the call on production as well made it dead in every
  // environment.
  useEffect(() => {
    validateChildren(props.children);
  }, [props.children]);

  // All dispatch paths share coordinates, bubbling, and per-pointer capture.
  useEffect(() => {
    if (!twoState) return;
    const canvas = twoState.renderer.domElement;
    const hits = (event: MouseEvent) => {
      const point = getCanvasCoordinates(event, canvas, twoState);
      return getShapesAtPoint(eventShapes.current, point.x, point.y, twoState);
    };
    const release = (id: number) => {
      capturedShapes.current.delete(id);
      if (canvas.hasPointerCapture?.(id)) canvas.releasePointerCapture(id);
    };
    const dispatch = (
      target: Shape | Group | undefined,
      name: keyof EventHandlers,
      native: PointerEvent | MouseEvent | WheelEvent,
      recipients?: Array<Shape | Group>,
    ) => {
      if (!target) return;
      const point = getCanvasCoordinates(native, canvas, twoState);
      for (const current of recipients ?? getParentHierarchy(target, eventShapes.current)) {
        const handler = eventShapes.current.get(current)?.handlers[name];
        if (!handler) continue;
        const event = createTwoEvent(native, target, current, point, {
          setPointerCapture: (id) => {
            if (!('pointerId' in native) || native.pointerId !== id || !pointerDowns.current.has(id)) return;
            canvas.setPointerCapture?.(id);
            capturedShapes.current.set(id, current);
            const down = pointerDowns.current.get(id);
            if (down) down.captured = true;
          },
          releasePointerCapture: (id) => {
            if (capturedShapes.current.get(id) === current) release(id);
          },
          hasPointerCapture: (id) => capturedShapes.current.get(id) === current,
        });
        handler(event);
        if (event.stopped) break;
      }
    };
    const updateHover = (target: Shape | Group | undefined, event: PointerEvent) => {
      const previous = hoverTarget.current;
      if (previous === (target ?? null)) return;
      const next = new Set(target ? getParentHierarchy(target, eventShapes.current) : []);
      const old = hoveredShapes.current;
      dispatch(previous ?? undefined, 'onPointerOut', event);
      for (const current of old) {
        if (!next.has(current)) dispatch(previous ?? undefined, 'onPointerLeave', event, [current]);
      }
      dispatch(target, 'onPointerOver', event);
      for (const current of next) {
        if (!old.has(current)) dispatch(target, 'onPointerEnter', event, [current]);
      }
      hoveredShapes.current = next;
      hoverTarget.current = target ?? null;
    };
    const handleClick = (event: MouseEvent) => dispatch(hits(event)[0], 'onClick', event);
    const handleDoubleClick = (event: MouseEvent) => dispatch(hits(event)[0], 'onDoubleClick', event);
    const handleContextMenu = (event: MouseEvent) => dispatch(hits(event)[0], 'onContextMenu', event);
    const handleWheel = (event: WheelEvent) => dispatch(hits(event)[0], 'onWheel', event);
    const handlePointerDown = (event: PointerEvent) => {
      const target = hits(event)[0];
      pointerDowns.current.set(event.pointerId, {
        missed: !target && event.button === 0 && event.isPrimary !== false,
        captured: false,
      });
      dispatch(target, 'onPointerDown', event);
    };
    const handlePointerMove = (event: PointerEvent) => {
      const target = hits(event)[0];
      dispatch(capturedShapes.current.get(event.pointerId) ?? target, 'onPointerMove', event);
      updateHover(target, event);
    };
    const handlePointerUp = (event: PointerEvent) => {
      const target = hits(event)[0];
      const down = pointerDowns.current.get(event.pointerId);
      try {
        dispatch(capturedShapes.current.get(event.pointerId) ?? target, 'onPointerUp', event);
        // A complete primary press begun and ended in empty space is missed.
        if (down?.missed && !down.captured && !target) onPointerMissed?.(event);
      } finally {
        pointerDowns.current.delete(event.pointerId);
        release(event.pointerId);
      }
    };
    const handlePointerCancel = (event: PointerEvent) => {
      try {
        dispatch(capturedShapes.current.get(event.pointerId) ?? hits(event)[0], 'onPointerCancel', event);
        updateHover(undefined, event);
      } finally {
        pointerDowns.current.delete(event.pointerId);
        release(event.pointerId);
      }
    };
    const handlePointerLeave = (event: PointerEvent) => updateHover(undefined, event);
    const handleLostCapture = (event: PointerEvent) => capturedShapes.current.delete(event.pointerId);
    const handleOutsideEnd = (event: PointerEvent) => {
      if (!(event.target instanceof Node) || !canvas.contains(event.target)) {
        pointerDowns.current.delete(event.pointerId);
        release(event.pointerId);
      }
    };
    canvas.addEventListener('click', handleClick);
    canvas.addEventListener('dblclick', handleDoubleClick);
    canvas.addEventListener('contextmenu', handleContextMenu);
    canvas.addEventListener('wheel', handleWheel);
    canvas.addEventListener('pointerdown', handlePointerDown);
    canvas.addEventListener('pointermove', handlePointerMove);
    canvas.addEventListener('pointerup', handlePointerUp);
    canvas.addEventListener('pointercancel', handlePointerCancel);
    canvas.addEventListener('pointerleave', handlePointerLeave);
    canvas.addEventListener('lostpointercapture', handleLostCapture);
    window.addEventListener('pointerup', handleOutsideEnd);
    window.addEventListener('pointercancel', handleOutsideEnd);
    return () => {
      canvas.removeEventListener('click', handleClick);
      canvas.removeEventListener('dblclick', handleDoubleClick);
      canvas.removeEventListener('contextmenu', handleContextMenu);
      canvas.removeEventListener('wheel', handleWheel);
      canvas.removeEventListener('pointerdown', handlePointerDown);
      canvas.removeEventListener('pointermove', handlePointerMove);
      canvas.removeEventListener('pointerup', handlePointerUp);
      canvas.removeEventListener('pointercancel', handlePointerCancel);
      canvas.removeEventListener('pointerleave', handlePointerLeave);
      canvas.removeEventListener('lostpointercapture', handleLostCapture);
      window.removeEventListener('pointerup', handleOutsideEnd);
      window.removeEventListener('pointercancel', handleOutsideEnd);
    };
  }, [twoState, onPointerMissed]);

  // Apply DOM props to Two.js's actual canvas/SVG element
  useLayoutEffect(() => {
    if (!twoState) return;

    // Skip if in fullscreen mode - Two.js manages styles
    if (constructorOptions.current?.fullscreen) {
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
        element.setAttribute('class', value as string);
      } else if (key.startsWith('on') && typeof value === 'function') {
        // Handle React event props (onClick, onMouseMove, etc.)
        const eventName = key.slice(2).toLowerCase();
        element.addEventListener(eventName, value as EventListener);
      } else if (key.startsWith('aria-') || key.startsWith('data-')) {
        // Set as attribute for aria-* and data-* props
        element.setAttribute(key, String(value));
      } else if (element instanceof SVGElement) {
        // SVG properties such as viewBox are readonly animated objects.
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
      hitTestPoint,
    }),
    [twoState, registerEventShape, unregisterEventShape, hitTestPoint],
  );

  const parentValue = useMemo<TwoParentContextValue>(
    () => ({
      parent: parentState,
      attachChild,
      detachChild,
      registerChildOrder,
    }),
    [parentState, attachChild, detachChild, registerChildOrder],
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
            {React.Children.map(props.children, (child, index) => {
              if (!React.isValidElement(child)) return child;
              return (
                <ChildSlotContext.Provider value={index} key={child.key ?? index}>
                  {child}
                </ChildSlotContext.Provider>
              );
            })}
          </div>
        </TwoSizeContext.Provider>
      </TwoParentContext.Provider>
    </TwoCoreContext.Provider>
  );
});

Provider.displayName = 'Canvas';
