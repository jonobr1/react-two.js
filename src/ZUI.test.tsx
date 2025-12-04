import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useZUI } from '../lib/ZUI';
import type { RefGroup } from '../lib/Group';

// Mock the Two.js ZUI class
vi.mock('two.js/extras/jsm/zui.js', () => {
  class MockZUI {
    zoom = 0;
    scale = 1.0;
    limits = {
      scale: { min: -Infinity, max: Infinity },
      x: { min: -Infinity, max: Infinity },
      y: { min: -Infinity, max: Infinity },
    };
    surfaceMatrix = {
      identity: vi.fn().mockReturnThis(),
      scale: vi.fn().mockReturnThis(),
      inverse: vi.fn().mockReturnThis(),
      multiply: vi.fn().mockReturnValue([0, 0, 1]),
      elements: [1, 0, 0, 0, 1, 0, 0, 0, 1],
    };
    viewportOffset = {
      top: 0,
      left: 0,
      matrix: {
        identity: vi.fn().mockReturnThis(),
        translate: vi.fn().mockReturnThis(),
        inverse: vi.fn().mockReturnThis(),
        multiply: vi.fn().mockReturnValue([0, 0, 1]),
        clone: vi.fn().mockReturnThis(),
      },
    };

    constructor(
      public group: unknown,
      public viewport: HTMLElement
    ) {}

    addLimits(min?: number, max?: number) {
      if (typeof min !== 'undefined') this.limits.scale.min = min;
      if (typeof max !== 'undefined') this.limits.scale.max = max;
      return this;
    }

    zoomBy(byF: number, clientX: number, clientY: number) {
      // Unused params for mock implementation
      void clientX;
      void clientY;
      this.zoom += byF;
      this.scale = Math.exp(this.zoom);
      return this;
    }

    zoomSet(zoom: number, clientX: number, clientY: number) {
      // Unused params for mock implementation
      void clientX;
      void clientY;
      const clampedScale = Math.max(
        this.limits.scale.min,
        Math.min(zoom, this.limits.scale.max)
      );
      this.zoom = Math.log(clampedScale);
      this.scale = clampedScale;
      return this;
    }

    translateSurface(x: number, y: number) {
      // Unused params for mock implementation
      void x;
      void y;
      return this;
    }

    reset() {
      this.zoom = 0;
      this.scale = 1.0;
      this.surfaceMatrix.identity();
      return this;
    }

    clientToSurface(x: number, y: number, z?: number) {
      return { x, y, z: z ?? 1 };
    }

    surfaceToClient(x: number, y: number, z?: number) {
      return { x, y, z: z ?? 1 };
    }

    updateOffset() {
      return this;
    }

    updateSurface() {
      return this;
    }

    fitToLimits(s: number) {
      return Math.max(
        this.limits.scale.min,
        Math.min(s, this.limits.scale.max)
      );
    }
  }

  return { ZUI: MockZUI };
});

// Mock the Context
vi.mock('../lib/Context', () => ({
  useTwo: () => ({
    two: null,
    parent: null,
    width: 800,
    height: 600,
    domElement: document.createElement('div'),
    registerEventShape: vi.fn(),
    unregisterEventShape: vi.fn(),
  }),
}));

describe('useZUI', () => {
  let mockGroup: RefGroup;

  beforeEach(() => {
    // Create mock group
    mockGroup = {
      translation: { x: 0, y: 0, set: vi.fn() },
      scale: 1,
      add: vi.fn(),
      remove: vi.fn(),
    } as unknown as RefGroup;
  });

  it('should initialize with default state', () => {
    const groupRef = { current: mockGroup };

    const { result } = renderHook(() => useZUI(groupRef));

    expect(result.current.zoom).toBe(0);
    expect(result.current.scale).toBe(1.0);
    expect(result.current.instance).toBeDefined();
  });

  it('should apply zoom limits', () => {
    const groupRef = { current: mockGroup };

    const { result } = renderHook(() =>
      useZUI(groupRef, {
        minZoom: 0.5,
        maxZoom: 2.0,
      })
    );

    expect(result.current.instance).toBeDefined();
  });

  it('should provide zoomBy method', () => {
    const groupRef = { current: mockGroup };

    const { result } = renderHook(() => useZUI(groupRef));

    result.current.zoomBy(0.1, 100, 100);

    expect(result.current.zoom).toBeGreaterThan(0);
    expect(result.current.scale).toBeGreaterThan(1);
  });

  it('should provide zoomSet method', () => {
    const groupRef = { current: mockGroup };

    const { result } = renderHook(() => useZUI(groupRef));

    result.current.zoomSet(2.0, 100, 100);

    expect(result.current.scale).toBe(2.0);
  });

  it('should provide translateSurface method', () => {
    const groupRef = { current: mockGroup };

    const { result } = renderHook(() => useZUI(groupRef));

    expect(() => result.current.translateSurface(10, 20)).not.toThrow();
  });

  it('should provide reset method', () => {
    const groupRef = { current: mockGroup };

    const { result } = renderHook(() => useZUI(groupRef));

    // Zoom in first
    result.current.zoomBy(0.5, 100, 100);
    expect(result.current.zoom).toBeGreaterThan(0);

    // Reset
    result.current.reset();
    expect(result.current.zoom).toBe(0);
    expect(result.current.scale).toBe(1.0);
  });

  it('should provide coordinate conversion methods', () => {
    const groupRef = { current: mockGroup };

    const { result } = renderHook(() => useZUI(groupRef));

    const surfaceCoords = result.current.clientToSurface(100, 200);
    expect(surfaceCoords).toEqual({ x: 100, y: 200, z: 1 });

    const clientCoords = result.current.surfaceToClient(50, 75);
    expect(clientCoords).toEqual({ x: 50, y: 75, z: 1 });
  });

  it('should handle null group ref gracefully', () => {
    const groupRef = { current: null };

    const { result } = renderHook(() => useZUI(groupRef));

    expect(result.current.instance).toBeNull();
    expect(() => result.current.zoomBy(0.1, 100, 100)).not.toThrow();
    expect(() => result.current.reset()).not.toThrow();
  });

  it('should use custom domElement when provided', () => {
    const groupRef = { current: mockGroup };
    const customElement = document.createElement('canvas');

    const { result } = renderHook(() =>
      useZUI(groupRef, {
        domElement: customElement,
      })
    );

    expect(result.current.instance).toBeDefined();
  });

  it('should accept all option flags', () => {
    const groupRef = { current: mockGroup };

    const { result } = renderHook(() =>
      useZUI(groupRef, {
        enableMouse: false,
        enableTouch: false,
        enableWheel: false,
        zoomDelta: 0.1,
      })
    );

    expect(result.current.instance).toBeDefined();
  });
});
