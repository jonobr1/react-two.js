import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type RefObject,
} from 'react';
import { ZUI } from 'two.js/extras/jsm/zui.js';
import { useTwo } from './Context';
import type { RefGroup } from './Group';

/**
 * Options for configuring the ZUI (Zooming User Interface) behavior
 */
export interface UseZUIOptions {
  /** Minimum zoom level (default: 0.01) */
  minZoom?: number;
  /** Maximum zoom level (default: 100) */
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

/**
 * Return value from useZUI hook containing control methods and reactive state
 */
export interface ZUIControls {
  /** Zoom by an incremental amount at a specific position */
  zoomBy: (byF: number, clientX: number, clientY: number) => void;
  /** Set zoom to an absolute level at a specific position */
  zoomSet: (zoom: number, clientX: number, clientY: number) => void;
  /** Pan the view by a delta amount */
  translateSurface: (x: number, y: number) => void;
  /** Reset zoom and pan to initial state */
  reset: () => void;
  /** Convert client coordinates to world coordinates */
  clientToSurface: (x: number, y: number, z?: number) => { x: number; y: number; z: number };
  /** Convert world coordinates to client coordinates */
  surfaceToClient: (x: number, y: number, z?: number) => { x: number; y: number; z: number };
  /** Current zoom position (logarithmic) */
  zoom: number;
  /** Current scale factor (exponential) */
  scale: number;
  /** Direct access to ZUI instance for advanced usage */
  instance: ZUI | null;
}

const DEFAULT_OPTIONS: Required<Omit<UseZUIOptions, 'domElement'>> = {
  minZoom: 0.01,
  maxZoom: 100,
  zoomDelta: 0.05,
  enableMouse: true,
  enableTouch: true,
  enableWheel: true,
};

/**
 * Hook for adding zoom and pan functionality to a Two.js Group
 *
 * @param groupRef - Reference to the Group component to make zoomable
 * @param options - Configuration options for zoom/pan behavior
 * @returns ZUI control methods and reactive state
 *
 * @example
 * ```tsx
 * const groupRef = useRef<RefGroup>(null);
 * const { zoom, scale, reset } = useZUI(groupRef, {
 *   minZoom: 0.5,
 *   maxZoom: 3.0,
 * });
 *
 * return (
 *   <>
 *     <button onClick={reset}>Reset</button>
 *     <Group ref={groupRef}>
 *       <Circle radius={50} />
 *     </Group>
 *   </>
 * );
 * ```
 */
export function useZUI(
  groupRef: RefObject<RefGroup>,
  options: UseZUIOptions = {}
): ZUIControls {
  const { domElement: contextDomElement } = useTwo();
  const zuiRef = useRef<ZUI | null>(null);
  const [zoom, setZoom] = useState(0);
  const [scale, setScale] = useState(1.0);

  // Merge options with defaults - memoize to avoid changing on every render
  const opts = useMemo(() => ({ ...DEFAULT_OPTIONS, ...options }), [
    options.minZoom,
    options.maxZoom,
    options.zoomDelta,
    options.enableMouse,
    options.enableTouch,
    options.enableWheel,
  ]);
  const targetElement = options.domElement ?? contextDomElement;

  // Store latest options in a ref to avoid recreating callbacks
  const optionsRef = useRef(opts);
  useEffect(() => {
    optionsRef.current = opts;
  }, [opts]);

  // Initialize ZUI instance
  useEffect(() => {
    const group = groupRef.current;
    if (!group || !targetElement) {
      return;
    }

    // Create ZUI instance
    const zui = new ZUI(group, targetElement);

    // Apply zoom limits
    zui.addLimits(opts.minZoom, opts.maxZoom);

    zuiRef.current = zui;

    // Sync initial state
    setZoom(zui.zoom);
    setScale(zui.scale);

    return () => {
      zuiRef.current = null;
    };
  }, [groupRef, targetElement, opts.minZoom, opts.maxZoom]);

  // Wrapped methods that update reactive state
  const zoomBy = useCallback((byF: number, clientX: number, clientY: number) => {
    const zui = zuiRef.current;
    if (!zui) return;

    zui.zoomBy(byF, clientX, clientY);
    setZoom(zui.zoom);
    setScale(zui.scale);
  }, []);

  const zoomSet = useCallback((zoom: number, clientX: number, clientY: number) => {
    const zui = zuiRef.current;
    if (!zui) return;

    zui.zoomSet(zoom, clientX, clientY);
    setZoom(zui.zoom);
    setScale(zui.scale);
  }, []);

  const translateSurface = useCallback((x: number, y: number) => {
    const zui = zuiRef.current;
    if (!zui) return;

    zui.translateSurface(x, y);
  }, []);

  const reset = useCallback(() => {
    const zui = zuiRef.current;
    if (!zui) return;

    zui.reset();
    setZoom(zui.zoom);
    setScale(zui.scale);
  }, []);

  const clientToSurface = useCallback((x: number, y: number, z?: number) => {
    const zui = zuiRef.current;
    if (!zui) return { x: 0, y: 0, z: z ?? 1 };

    return zui.clientToSurface(x, y, z);
  }, []);

  const surfaceToClient = useCallback((x: number, y: number, z?: number) => {
    const zui = zuiRef.current;
    if (!zui) return { x: 0, y: 0, z: z ?? 1 };

    return zui.surfaceToClient(x, y, z);
  }, []);

  // Mouse wheel zoom handler
  useEffect(() => {
    if (!opts.enableWheel || !targetElement) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();

      const delta = e.deltaY > 0 ? -optionsRef.current.zoomDelta : optionsRef.current.zoomDelta;
      zoomBy(delta, e.clientX, e.clientY);
    };

    targetElement.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      targetElement.removeEventListener('wheel', handleWheel);
    };
  }, [opts.enableWheel, targetElement, zoomBy]);

  // Mouse drag pan handler
  useEffect(() => {
    if (!opts.enableMouse || !targetElement) return;

    let isDragging = false;
    let lastX = 0;
    let lastY = 0;

    const handleMouseDown = (e: MouseEvent) => {
      // Only handle left mouse button
      if (e.button !== 0) return;

      isDragging = true;
      lastX = e.clientX;
      lastY = e.clientY;

      // Prevent text selection during drag
      e.preventDefault();
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;

      translateSurface(dx, dy);

      lastX = e.clientX;
      lastY = e.clientY;
    };

    const handleMouseUp = () => {
      isDragging = false;
    };

    targetElement.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      targetElement.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [opts.enableMouse, targetElement, translateSurface]);

  // Touch gesture handlers
  useEffect(() => {
    if (!opts.enableTouch || !targetElement) return;

    let touchStartDistance = 0;
    let lastTouchX = 0;
    let lastTouchY = 0;
    let isSingleTouch = false;
    let isPinching = false;

    const getTouchDistance = (touch1: Touch, touch2: Touch): number => {
      const dx = touch1.clientX - touch2.clientX;
      const dy = touch1.clientY - touch2.clientY;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const getTouchCenter = (touch1: Touch, touch2: Touch) => {
      return {
        x: (touch1.clientX + touch2.clientX) / 2,
        y: (touch1.clientY + touch2.clientY) / 2,
      };
    };

    const handleTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 1) {
        // Single touch - pan
        isSingleTouch = true;
        isPinching = false;
        const touch = e.touches[0];
        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
      } else if (e.touches.length === 2) {
        // Two touches - pinch zoom
        isSingleTouch = false;
        isPinching = true;
        touchStartDistance = getTouchDistance(e.touches[0], e.touches[1]);
        e.preventDefault();
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (isSingleTouch && e.touches.length === 1) {
        // Pan with single touch
        const touch = e.touches[0];
        const dx = touch.clientX - lastTouchX;
        const dy = touch.clientY - lastTouchY;

        translateSurface(dx, dy);

        lastTouchX = touch.clientX;
        lastTouchY = touch.clientY;
      } else if (isPinching && e.touches.length === 2) {
        // Pinch zoom
        const currentDistance = getTouchDistance(e.touches[0], e.touches[1]);
        const center = getTouchCenter(e.touches[0], e.touches[1]);

        // Calculate zoom delta based on distance change
        const distanceChange = currentDistance - touchStartDistance;
        const zoomDelta = (distanceChange / 100) * optionsRef.current.zoomDelta;

        zoomBy(zoomDelta, center.x, center.y);

        touchStartDistance = currentDistance;
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      isSingleTouch = false;
      isPinching = false;
    };

    targetElement.addEventListener('touchstart', handleTouchStart, { passive: false });
    targetElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    targetElement.addEventListener('touchend', handleTouchEnd);
    targetElement.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      targetElement.removeEventListener('touchstart', handleTouchStart);
      targetElement.removeEventListener('touchmove', handleTouchMove);
      targetElement.removeEventListener('touchend', handleTouchEnd);
      targetElement.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [opts.enableTouch, targetElement, zoomBy, translateSurface]);

  return {
    zoomBy,
    zoomSet,
    translateSurface,
    reset,
    clientToSurface,
    surfaceToClient,
    zoom,
    scale,
    instance: zuiRef.current,
  };
}
