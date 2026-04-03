import { useCallback, useEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import { ZUI } from 'two.js/extras/jsm/zui';
import type { Group } from 'two.js/src/group';
import { useTwo } from './Context';

export interface UseZUIOptions {
  /** Minimum zoom level (default: -Infinity) */
  minZoom?: number;
  /** Maximum zoom level (default: Infinity) */
  maxZoom?: number;
  /** Amount to zoom per wheel event (default: 0.05) */
  zoomDelta?: number;
  /** Enable mouse drag to pan (default: true) */
  enableMouse?: boolean;
  /** Enable touch gestures (default: true) */
  enableTouch?: boolean;
  /** Enable wheel to zoom (default: true) */
  enableWheel?: boolean;
  /** Override target element for event listeners */
  domElement?: HTMLElement | null;
}

export interface ZUIControls {
  /** Zoom by an incremental factor at the given client position */
  zoomBy: (byF: number, clientX: number, clientY: number) => void;
  /** Set the zoom level at the given client position */
  zoomSet: (zoom: number, clientX: number, clientY: number) => void;
  /** Pan the surface by x, y pixels */
  translateSurface: (x: number, y: number) => void;
  /** Reset zoom and pan to initial state */
  reset: () => void;
  /** Convert client (screen) coordinates to surface (world) coordinates */
  clientToSurface: (
    x: number,
    y: number,
    z?: number
  ) => { x: number; y: number; z: number };
  /** Convert surface (world) coordinates to client (screen) coordinates */
  surfaceToClient: (
    x: number,
    y: number,
    z?: number
  ) => { x: number; y: number; z: number };
  /** Current zoom position value */
  zoom: number;
  /** Current scale value */
  scale: number;
  /** Direct access to the underlying ZUI instance */
  instance: ZUI | null;
}

/**
 * @name useZUI
 * @description React hook that integrates Two.js ZUI (Zooming User Interface)
 * functionality for Google Maps or Adobe Illustrator-style zoom and pan
 * interactions.
 *
 * @param groupRef - A ref pointing to a Two.js Group to apply zoom/pan to
 * @param options - Configuration options
 * @returns ZUIControls - Methods and state for controlling the ZUI
 *
 * @example
 * ```tsx
 * function ZoomableScene() {
 *   const groupRef = useRef(null);
 *   const { zoom, scale, reset } = useZUI(groupRef, {
 *     minZoom: 0.5,
 *     maxZoom: 3.0,
 *   });
 *
 *   return (
 *     <>
 *       <button onClick={reset}>Reset View</button>
 *       <Canvas autostart>
 *         <Group ref={groupRef}>
 *           <Circle radius={50} />
 *         </Group>
 *       </Canvas>
 *     </>
 *   );
 * }
 * ```
 */
export function useZUI(
  groupRef: RefObject<Group | null>,
  options: UseZUIOptions = {}
): ZUIControls {
  const {
    minZoom,
    maxZoom,
    zoomDelta = 0.05,
    enableMouse = true,
    enableTouch = true,
    enableWheel = true,
    domElement: domElementOverride,
  } = options;

  const { domElement: contextDomElement } = useTwo();
  const zuiRef = useRef<ZUI | null>(null);
  const [zuiInstance, setZuiInstance] = useState<ZUI | null>(null);
  const [zoom, setZoom] = useState(0);
  const [scale, setScale] = useState(1);

  // Track drag state for mouse pan
  const isDragging = useRef(false);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // Track touch state for pinch-to-zoom
  const lastTouchDist = useRef<number | null>(null);
  const lastTouchMidpoint = useRef({ x: 0, y: 0 });

  // Synchronize reactive zoom/scale state from ZUI instance
  const syncState = useCallback(() => {
    const zui = zuiRef.current;
    if (!zui) return;
    setZoom(zui.zoom);
    setScale(zui.scale);
  }, []);

  // Initialize ZUI instance when group and domElement are available
  useEffect(() => {
    const group = groupRef.current;
    const element =
      domElementOverride !== undefined
        ? domElementOverride
        : contextDomElement;

    if (!group || !element) return;

    const zui = new ZUI(group, element);

    // addLimits JS implementation accepts undefined gracefully despite typed signature
    if (typeof minZoom === 'number') {
      zui.addLimits(minZoom, maxZoom as number);
    } else if (typeof maxZoom === 'number') {
      zui.addLimits(undefined as unknown as number, maxZoom);
    }

    zuiRef.current = zui;
    setZuiInstance(zui);
    syncState();

    return () => {
      zuiRef.current = null;
      setZuiInstance(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupRef, contextDomElement, domElementOverride, minZoom, maxZoom]);

  // Stable imperative method wrappers
  const zoomBy = useCallback(
    (byF: number, clientX: number, clientY: number) => {
      if (!zuiRef.current) return;
      zuiRef.current.zoomBy(byF, clientX, clientY);
      syncState();
    },
    [syncState]
  );

  const zoomSet = useCallback(
    (zoom: number, clientX: number, clientY: number) => {
      if (!zuiRef.current) return;
      zuiRef.current.zoomSet(zoom, clientX, clientY);
      syncState();
    },
    [syncState]
  );

  const translateSurface = useCallback(
    (x: number, y: number) => {
      if (!zuiRef.current) return;
      zuiRef.current.translateSurface(x, y);
      syncState();
    },
    [syncState]
  );

  const reset = useCallback(() => {
    if (!zuiRef.current) return;
    zuiRef.current.reset();
    syncState();
  }, [syncState]);

  const clientToSurface = useCallback(
    (x: number, y: number, z?: number) => {
      if (!zuiRef.current) return { x, y, z: z ?? 1 };
      return zuiRef.current.clientToSurface({ x, y, z });
    },
    []
  );

  const surfaceToClient = useCallback(
    (x: number, y: number, z?: number) => {
      if (!zuiRef.current) return { x, y, z: z ?? 1 };
      return zuiRef.current.surfaceToClient({ x, y, z });
    },
    []
  );

  // Wheel zoom event handler
  useEffect(() => {
    if (!enableWheel) return;

    const element =
      domElementOverride !== undefined
        ? domElementOverride
        : contextDomElement;
    if (!element) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (!zuiRef.current) return;
      const delta = e.deltaY < 0 ? zoomDelta : -zoomDelta;
      zuiRef.current.zoomBy(delta, e.clientX, e.clientY);
      syncState();
    };

    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => {
      element.removeEventListener('wheel', handleWheel);
    };
  }, [enableWheel, contextDomElement, domElementOverride, zoomDelta, syncState]);

  // Mouse drag pan event handlers
  useEffect(() => {
    if (!enableMouse) return;

    const element =
      domElementOverride !== undefined
        ? domElementOverride
        : contextDomElement;
    if (!element) return;

    const handleMouseDown = (e: MouseEvent) => {
      isDragging.current = true;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !zuiRef.current) return;
      const dx = e.clientX - lastMousePos.current.x;
      const dy = e.clientY - lastMousePos.current.y;
      lastMousePos.current = { x: e.clientX, y: e.clientY };
      zuiRef.current.translateSurface(dx, dy);
      syncState();
    };

    const handleMouseUp = () => {
      isDragging.current = false;
    };

    element.addEventListener('mousedown', handleMouseDown);
    element.addEventListener('mousemove', handleMouseMove);
    element.addEventListener('mouseup', handleMouseUp);
    // Also listen for mouseup on window to handle cases where
    // the mouse is released outside the element
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      element.removeEventListener('mousedown', handleMouseDown);
      element.removeEventListener('mousemove', handleMouseMove);
      element.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [enableMouse, contextDomElement, domElementOverride, syncState]);

  // Touch gesture handlers (pan + pinch-to-zoom)
  useEffect(() => {
    if (!enableTouch) return;

    const element =
      domElementOverride !== undefined
        ? domElementOverride
        : contextDomElement;
    if (!element) return;

    const getTouchDistance = (touches: TouchList) => {
      const dx = touches[0].clientX - touches[1].clientX;
      const dy = touches[0].clientY - touches[1].clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getTouchMidpoint = (touches: TouchList) => ({
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2,
    });

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        lastTouchDist.current = getTouchDistance(e.touches);
        lastTouchMidpoint.current = getTouchMidpoint(e.touches);
      } else if (e.touches.length === 1) {
        lastTouchDist.current = null;
        lastTouchMidpoint.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      if (!zuiRef.current) return;

      if (e.touches.length === 2) {
        // Pinch to zoom
        const dist = getTouchDistance(e.touches);
        const midpoint = getTouchMidpoint(e.touches);

        if (lastTouchDist.current !== null) {
          const scale = dist / lastTouchDist.current;
          const zoomDeltaAmount = ZUI.ScaleToPosition(scale);
          zuiRef.current.zoomBy(zoomDeltaAmount, midpoint.x, midpoint.y);

          // Also pan to follow the midpoint
          const dx = midpoint.x - lastTouchMidpoint.current.x;
          const dy = midpoint.y - lastTouchMidpoint.current.y;
          if (dx !== 0 || dy !== 0) {
            zuiRef.current.translateSurface(dx, dy);
          }
        }

        lastTouchDist.current = dist;
        lastTouchMidpoint.current = midpoint;
        syncState();
      } else if (e.touches.length === 1) {
        // Single touch pan
        const dx = e.touches[0].clientX - lastTouchMidpoint.current.x;
        const dy = e.touches[0].clientY - lastTouchMidpoint.current.y;
        lastTouchMidpoint.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
        zuiRef.current.translateSurface(dx, dy);
        syncState();
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (e.touches.length < 2) {
        lastTouchDist.current = null;
      }
      if (e.touches.length === 1) {
        lastTouchMidpoint.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      }
    };

    element.addEventListener('touchstart', handleTouchStart, {
      passive: false,
    });
    element.addEventListener('touchmove', handleTouchMove, { passive: false });
    element.addEventListener('touchend', handleTouchEnd);

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enableTouch, contextDomElement, domElementOverride, syncState]);

  return {
    zoomBy,
    zoomSet,
    translateSurface,
    reset,
    clientToSurface,
    surfaceToClient,
    zoom,
    scale,
    instance: zuiInstance,
  };
}
