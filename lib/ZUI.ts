import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
  type RefObject,
} from 'react';
import { useTwo } from './Context';
import type { RefGroup } from './Group';
import type { ZUIConstructor, ZUIInstance } from './zuiTypes';
import {
  centroid,
  clamp,
  distance,
  pinchWheelZoomDelta,
  pinchZoomDelta,
  wheelZoomDelta,
  type PanBounds,
  type Point,
} from './zuiMath';

// two.js ships no declarations for its extras; `lib/zuiTypes.ts` types it
// structurally so we never leak an ambient module into consumers.
// @ts-expect-error - untyped two.js extra
import { ZUI as ZUIImpl } from 'two.js/extras/jsm/zui.js';

const ZUIClass = ZUIImpl as unknown as ZUIConstructor;

/**
 * A ref whose `current` is always present. React 18's own `RefObject<T>` types
 * `current` as `T | null`, which would force a null check on every read of
 * `zui.state.current`.
 */
export interface ReadonlyRef<T> {
  readonly current: T;
}

/** Immutable snapshot of the current zoom/pan state. */
export interface ZUIState {
  /** Logarithmic zoom position. `scale === Math.exp(zoom)`. */
  zoom: number;
  /** Linear scale factor. */
  scale: number;
  /** Surface translation on the x axis, in client pixels. */
  x: number;
  /** Surface translation on the y axis, in client pixels. */
  y: number;
}

export interface UseZUIOptions {
  /** Minimum scale factor (default: 0.25) */
  minZoom?: number;
  /** Maximum scale factor (default: 8) */
  maxZoom?: number;
  /** Log-space zoom units per wheel notch (default: 0.05) */
  wheelZoomSpeed?: number;
  /** Optional clamp on surface translation, in client pixels */
  panBounds?: PanBounds;
  /**
   * `'background'` (default) pans only when the pointer misses every
   * registered shape, so shape drag handlers win. `'always'` pans on any
   * drag. `false` disables pointer panning entirely.
   */
  pan?: 'background' | 'always' | false;
  /** `'wheel'` (default) enables wheel and trackpad-pinch zoom; `false` disables it. */
  zoom?: 'wheel' | false;
  /** Override the element that listeners attach to (default: the Two.js renderer element) */
  domElement?: HTMLElement | null;
  /** Called at most once per animation frame while zoom or pan changes. */
  onChange?: (state: ZUIState) => void;
}

export interface ZUIControls {
  /** Live, always-current state. Reading this never triggers a re-render. */
  state: ReadonlyRef<ZUIState>;
  /** True while a pointer pan is in progress. */
  isPanning: ReadonlyRef<boolean>;
  /** The underlying Two.js ZUI instance, for advanced use. */
  instance: ReadonlyRef<ZUIInstance | null>;
  /** Zoom by a log-space amount, anchored at the given client point. */
  zoomBy: (byF: number, clientX: number, clientY: number) => void;
  /** Zoom to an absolute scale factor, anchored at the given client point. */
  zoomTo: (scale: number, clientX: number, clientY: number) => void;
  /** Pan by a delta in client pixels. */
  panBy: (dx: number, dy: number) => void;
  /** Pan to an absolute surface translation in client pixels. */
  panTo: (x: number, y: number) => void;
  /** Restore scale 1 and zero translation. */
  reset: () => void;
  /** Convert client coordinates into the ZUI group's local space. */
  clientToSurface: (x: number, y: number) => Point;
  /** Convert the ZUI group's local space back into client coordinates. */
  surfaceToClient: (x: number, y: number) => Point;
  /** Subscribe to coalesced state changes. Used by `useZUIState`. */
  subscribe: (listener: () => void) => () => void;
  /** Read the current immutable snapshot. Used by `useZUIState`. */
  getSnapshot: () => ZUIState;
}

const IDENTITY_STATE: ZUIState = { zoom: 0, scale: 1, x: 0, y: 0 };

/**
 * Add zoom and pan to a react-two.js `Group`.
 *
 * The target group's `x`, `y`, and `scale` are owned by this hook — do not
 * also pass those props to it, or the two will fight each other.
 *
 * @example
 * ```tsx
 * function Scene() {
 *   const groupRef = useRef<RefGroup | null>(null);
 *   const zui = useZUI(groupRef, { minZoom: 0.25, maxZoom: 8 });
 *
 *   return (
 *     <Group ref={groupRef}>
 *       <Circle radius={50} />
 *     </Group>
 *   );
 * }
 * ```
 */
export function useZUI(
  target: RefObject<RefGroup | null>,
  options: UseZUIOptions = {}
): ZUIControls {
  const { two, hitTestPoint } = useTwo();

  const instance = useRef<ZUIInstance | null>(null);
  const state = useRef<ZUIState>(IDENTITY_STATE);
  const isPanning = useRef(false);
  const listeners = useRef(new Set<() => void>());
  const frame = useRef<number | null>(null);

  // Latest options, read inside event handlers so they never need rebinding.
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const {
    minZoom = 0.25,
    maxZoom = 8,
    domElement: domElementOption,
  } = options;

  const element = domElementOption ?? two?.renderer.domElement ?? null;

  /**
   * Publish a fresh immutable snapshot. The snapshot updates synchronously so
   * drag math stays exact, but subscribers are notified on the next animation
   * frame so a wheel gesture cannot re-render the scene per event.
   */
  const flush = useCallback(() => {
    const zui = instance.current;
    if (!zui) return;

    const elements = zui.surfaceMatrix.elements;
    state.current = {
      zoom: zui.zoom,
      scale: zui.scale,
      x: elements[2],
      y: elements[5],
    };

    if (frame.current !== null) return;

    frame.current = requestAnimationFrame(() => {
      frame.current = null;
      optionsRef.current.onChange?.(state.current);
      for (const listener of listeners.current) {
        listener();
      }
    });
  }, []);

  /** Two.js's ZUI declares limits.x / limits.y but never applies them. */
  const applyPanBounds = useCallback(() => {
    const zui = instance.current;
    const bounds = optionsRef.current.panBounds;
    if (!zui || !bounds) return;

    const elements = zui.surfaceMatrix.elements;
    const x = clamp(
      elements[2],
      bounds.x?.[0] ?? -Infinity,
      bounds.x?.[1] ?? Infinity
    );
    const y = clamp(
      elements[5],
      bounds.y?.[0] ?? -Infinity,
      bounds.y?.[1] ?? Infinity
    );

    if (x !== elements[2] || y !== elements[5]) {
      zui.translateSurface(x - elements[2], y - elements[5]);
    }
  }, []);

  // Create the ZUI instance once the group and element both exist.
  useEffect(() => {
    const group = target.current;
    if (!group || !element) return;

    const zui = new ZUIClass(group, element);
    zui.addLimits(minZoom, maxZoom);
    instance.current = zui;
    flush();

    return () => {
      instance.current = null;
      if (frame.current !== null) {
        cancelAnimationFrame(frame.current);
        frame.current = null;
      }
    };
  }, [target, element, minZoom, maxZoom, flush]);

  const zoomBy = useCallback(
    (byF: number, clientX: number, clientY: number) => {
      const zui = instance.current;
      if (!zui) return;
      zui.zoomBy(byF, clientX, clientY);
      applyPanBounds();
      flush();
    },
    [applyPanBounds, flush]
  );

  const zoomTo = useCallback(
    (scale: number, clientX: number, clientY: number) => {
      const zui = instance.current;
      if (!zui) return;
      zui.zoomSet(scale, clientX, clientY);
      applyPanBounds();
      flush();
    },
    [applyPanBounds, flush]
  );

  const panBy = useCallback(
    (dx: number, dy: number) => {
      const zui = instance.current;
      if (!zui) return;
      zui.translateSurface(dx, dy);
      applyPanBounds();
      flush();
    },
    [applyPanBounds, flush]
  );

  const panTo = useCallback(
    (x: number, y: number) => {
      const zui = instance.current;
      if (!zui) return;
      const elements = zui.surfaceMatrix.elements;
      zui.translateSurface(x - elements[2], y - elements[5]);
      applyPanBounds();
      flush();
    },
    [applyPanBounds, flush]
  );

  const reset = useCallback(() => {
    const zui = instance.current;
    if (!zui) return;
    zui.reset();
    flush();
  }, [flush]);

  const clientToSurface = useCallback((x: number, y: number): Point => {
    const zui = instance.current;
    if (!zui) return { x, y };
    const result = zui.clientToSurface(x, y);
    return { x: result.x, y: result.y };
  }, []);

  const surfaceToClient = useCallback((x: number, y: number): Point => {
    const zui = instance.current;
    if (!zui) return { x, y };
    const result = zui.surfaceToClient(x, y);
    return { x: result.x, y: result.y };
  }, []);

  const subscribe = useCallback((listener: () => void) => {
    listeners.current.add(listener);
    return () => {
      listeners.current.delete(listener);
    };
  }, []);

  const getSnapshot = useCallback(() => state.current, []);

  // Pointer panning and pinch zoom. One code path covers mouse, touch and pen.
  useEffect(() => {
    if (!element) return;

    const active = new Map<number, Point>();
    let lastCentroid: Point | null = null;
    let lastDistance = 0;

    const points = () => Array.from(active.values());

    const handlePointerDown = (event: PointerEvent) => {
      const mode = optionsRef.current.pan ?? 'background';
      if (mode === false) return;
      if (event.pointerType === 'mouse' && event.button !== 0) return;
      if (mode === 'background' && hitTestPoint(event.clientX, event.clientY)) {
        return;
      }

      active.set(event.pointerId, { x: event.clientX, y: event.clientY });
      isPanning.current = true;
      lastCentroid = centroid(points());
      lastDistance = active.size === 2 ? distance(points()[0], points()[1]) : 0;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (!active.has(event.pointerId)) return;

      active.set(event.pointerId, { x: event.clientX, y: event.clientY });
      const current = points();
      const nextCentroid = centroid(current);

      if (lastCentroid) {
        panBy(nextCentroid.x - lastCentroid.x, nextCentroid.y - lastCentroid.y);
      }
      lastCentroid = nextCentroid;

      if (current.length === 2) {
        const nextDistance = distance(current[0], current[1]);
        if (lastDistance > 0) {
          zoomBy(
            pinchZoomDelta(lastDistance, nextDistance),
            nextCentroid.x,
            nextCentroid.y
          );
        }
        lastDistance = nextDistance;
      }
    };

    const endPointer = (event: PointerEvent) => {
      if (!active.delete(event.pointerId)) return;

      const remaining = points();
      lastCentroid = remaining.length > 0 ? centroid(remaining) : null;
      lastDistance =
        remaining.length === 2 ? distance(remaining[0], remaining[1]) : 0;
      isPanning.current = active.size > 0;
    };

    element.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', endPointer);
    window.addEventListener('pointercancel', endPointer);
    window.addEventListener('lostpointercapture', endPointer);

    return () => {
      element.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', endPointer);
      window.removeEventListener('pointercancel', endPointer);
      window.removeEventListener('lostpointercapture', endPointer);
    };
  }, [element, hitTestPoint, panBy, zoomBy]);

  // Wheel zoom, including ctrl+wheel trackpad pinch.
  useEffect(() => {
    if (!element) return;

    const handleWheel = (event: WheelEvent) => {
      if ((optionsRef.current.zoom ?? 'wheel') === false) return;

      event.preventDefault();

      const delta = event.ctrlKey
        ? pinchWheelZoomDelta(event.deltaY)
        : wheelZoomDelta(
            event.deltaY,
            event.deltaMode,
            optionsRef.current.wheelZoomSpeed ?? 0.05,
            element.clientHeight || window.innerHeight
          );

      zoomBy(delta, event.clientX, event.clientY);
    };

    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => element.removeEventListener('wheel', handleWheel);
  }, [element, zoomBy]);

  return useMemo(
    () => ({
      state,
      isPanning,
      instance,
      zoomBy,
      zoomTo,
      panBy,
      panTo,
      reset,
      clientToSurface,
      surfaceToClient,
      subscribe,
      getSnapshot,
    }),
    [
      zoomBy,
      zoomTo,
      panBy,
      panTo,
      reset,
      clientToSurface,
      surfaceToClient,
      subscribe,
      getSnapshot,
    ]
  );
}

/**
 * Opt into re-rendering when zoom or pan changes. Only use this in components
 * that actually display the value — `useZUI` alone never re-renders.
 */
export function useZUIState(controls: ZUIControls): ZUIState {
  return useSyncExternalStore(
    controls.subscribe,
    controls.getSnapshot,
    controls.getSnapshot
  );
}
