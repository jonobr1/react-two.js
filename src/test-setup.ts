import '@testing-library/jest-dom';

// Global mock for HTMLCanvasElement.prototype.getContext in JSDOM
if (typeof window !== 'undefined' && HTMLCanvasElement.prototype) {
  HTMLCanvasElement.prototype.getContext = function () {
    return {
      fillRect: () => {},
      clearRect: () => {},
      getImageData: () => ({ data: [] }),
      putImageData: () => {},
      createImageData: () => [],
      setTransform: () => {},
      drawImage: () => {},
      save: () => {},
      fillText: () => {},
      restore: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      closePath: () => {},
      stroke: () => {},
      translate: () => {},
      scale: () => {},
      rotate: () => {},
      arc: () => {},
      fill: () => {},
      measureText: () => ({ width: 0 }),
      transform: () => {},
      rect: () => {},
      clip: () => {},
      bezierCurveTo: () => {},
      quadraticCurveTo: () => {},
    } as unknown as CanvasRenderingContext2D;
    // `getContext` is an overloaded signature covering 2d/webgl/bitmaprenderer;
    // this stub only ever serves the 2d path, so assert the whole assignment.
  } as unknown as typeof HTMLCanvasElement.prototype.getContext;
}

/**
 * jsdom does not implement PointerEvent. The ZUI hook binds pointer events
 * exclusively, so tests need a minimal stand-in. MouseEvent already carries
 * clientX/clientY/button/buttons, so only the pointer-specific fields are added.
 */
interface PointerEventInitLike extends MouseEventInit {
  pointerId?: number;
  pointerType?: string;
  isPrimary?: boolean;
}

if (typeof globalThis.PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    readonly pointerId: number;
    readonly pointerType: string;
    readonly isPrimary: boolean;

    constructor(type: string, params: PointerEventInitLike = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
      this.pointerType = params.pointerType ?? 'mouse';
      this.isPrimary = params.isPrimary ?? true;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (globalThis as any).PointerEvent = PointerEventPolyfill;
}