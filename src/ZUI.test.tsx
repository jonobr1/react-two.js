import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useRef } from 'react';

// Use vi.hoisted to declare mocks that are referenced in vi.mock factories
const { mockZuiInstance, MockZUI, mockDomElement } = vi.hoisted(() => {
  const mockDomElement = document.createElement('canvas');

  const mockZuiInstance = {
    zoom: 0,
    scale: 1,
    zoomBy: vi.fn().mockReturnThis(),
    zoomSet: vi.fn().mockReturnThis(),
    translateSurface: vi.fn().mockReturnThis(),
    reset: vi.fn().mockReturnThis(),
    clientToSurface: vi.fn().mockReturnValue({ x: 10, y: 20, z: 1 }),
    surfaceToClient: vi.fn().mockReturnValue({ x: 100, y: 200, z: 1 }),
    addLimits: vi.fn().mockReturnThis(),
  };

  const MockZUI = vi.fn().mockImplementation(() => mockZuiInstance);
  (MockZUI as unknown as { ScaleToPosition: (s: number) => number }).ScaleToPosition = (scale: number) => Math.log(scale);

  return { mockZuiInstance, MockZUI, mockDomElement };
});

vi.mock('two.js/extras/jsm/zui', () => ({
  ZUI: MockZUI,
}));

vi.mock('../lib/Context', () => ({
  useTwo: vi.fn().mockReturnValue({
    two: null,
    domElement: mockDomElement,
    registerEventShape: vi.fn(),
    unregisterEventShape: vi.fn(),
    parent: null,
    width: 400,
    height: 300,
  }),
}));

import { useZUI } from '../lib/ZUI';

describe('useZUI', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockZuiInstance.zoom = 0;
    mockZuiInstance.scale = 1;
    // Restore default return values after clearAllMocks
    mockZuiInstance.zoomBy.mockReturnThis();
    mockZuiInstance.zoomSet.mockReturnThis();
    mockZuiInstance.translateSurface.mockReturnThis();
    mockZuiInstance.reset.mockReturnThis();
    mockZuiInstance.addLimits.mockReturnThis();
    mockZuiInstance.clientToSurface.mockReturnValue({ x: 10, y: 20, z: 1 });
    mockZuiInstance.surfaceToClient.mockReturnValue({ x: 100, y: 200, z: 1 });
    MockZUI.mockReturnValue(mockZuiInstance);
  });

  it('initializes ZUI with group and domElement', () => {
    const groupMock = {} as never;
    const { result } = renderHook(() => {
      const groupRef = useRef(groupMock);
      return useZUI(groupRef);
    });

    expect(MockZUI).toHaveBeenCalledWith(groupMock, mockDomElement);
    expect(result.current.zoom).toBe(0);
    expect(result.current.scale).toBe(1);
  });

  it('does not initialize ZUI if groupRef is null', () => {
    const { result } = renderHook(() => {
      const groupRef = useRef<never>(null);
      return useZUI(groupRef);
    });

    expect(MockZUI).not.toHaveBeenCalled();
    expect(result.current.instance).toBeNull();
  });

  it('calls addLimits when minZoom and maxZoom are provided', () => {
    const groupMock = {} as never;
    renderHook(() => {
      const groupRef = useRef(groupMock);
      return useZUI(groupRef, { minZoom: 0.5, maxZoom: 3.0 });
    });

    expect(mockZuiInstance.addLimits).toHaveBeenCalledWith(0.5, 3.0);
  });

  it('does not call addLimits when no limits are provided', () => {
    const groupMock = {} as never;
    renderHook(() => {
      const groupRef = useRef(groupMock);
      return useZUI(groupRef);
    });

    expect(mockZuiInstance.addLimits).not.toHaveBeenCalled();
  });

  it('zoomBy calls ZUI zoomBy', async () => {
    const groupMock = {} as never;
    const { result } = renderHook(() => {
      const groupRef = useRef(groupMock);
      return useZUI(groupRef);
    });

    await act(async () => {
      result.current.zoomBy(0.05, 200, 150);
    });

    expect(mockZuiInstance.zoomBy).toHaveBeenCalledWith(0.05, 200, 150);
  });

  it('zoomSet calls ZUI zoomSet', async () => {
    const groupMock = {} as never;
    const { result } = renderHook(() => {
      const groupRef = useRef(groupMock);
      return useZUI(groupRef);
    });

    await act(async () => {
      result.current.zoomSet(2.0, 100, 100);
    });

    expect(mockZuiInstance.zoomSet).toHaveBeenCalledWith(2.0, 100, 100);
  });

  it('translateSurface calls ZUI translateSurface', async () => {
    const groupMock = {} as never;
    const { result } = renderHook(() => {
      const groupRef = useRef(groupMock);
      return useZUI(groupRef);
    });

    await act(async () => {
      result.current.translateSurface(50, 30);
    });

    expect(mockZuiInstance.translateSurface).toHaveBeenCalledWith(50, 30);
  });

  it('reset calls ZUI reset', async () => {
    const groupMock = {} as never;
    const { result } = renderHook(() => {
      const groupRef = useRef(groupMock);
      return useZUI(groupRef);
    });

    await act(async () => {
      result.current.reset();
    });

    expect(mockZuiInstance.reset).toHaveBeenCalled();
  });

  it('clientToSurface delegates to ZUI instance', () => {
    const groupMock = {} as never;
    const { result } = renderHook(() => {
      const groupRef = useRef(groupMock);
      return useZUI(groupRef);
    });

    const pos = result.current.clientToSurface(100, 200);
    expect(mockZuiInstance.clientToSurface).toHaveBeenCalledWith({
      x: 100,
      y: 200,
      z: undefined,
    });
    expect(pos).toEqual({ x: 10, y: 20, z: 1 });
  });

  it('surfaceToClient delegates to ZUI instance', () => {
    const groupMock = {} as never;
    const { result } = renderHook(() => {
      const groupRef = useRef(groupMock);
      return useZUI(groupRef);
    });

    const pos = result.current.surfaceToClient(10, 20);
    expect(mockZuiInstance.surfaceToClient).toHaveBeenCalledWith({
      x: 10,
      y: 20,
      z: undefined,
    });
    expect(pos).toEqual({ x: 100, y: 200, z: 1 });
  });

  it('clientToSurface returns fallback when no ZUI instance', () => {
    const { result } = renderHook(() => {
      const groupRef = useRef<never>(null);
      return useZUI(groupRef);
    });

    const pos = result.current.clientToSurface(100, 200, 1);
    expect(pos).toEqual({ x: 100, y: 200, z: 1 });
  });

  it('surfaceToClient returns fallback when no ZUI instance', () => {
    const { result } = renderHook(() => {
      const groupRef = useRef<never>(null);
      return useZUI(groupRef);
    });

    const pos = result.current.surfaceToClient(10, 20, 1);
    expect(pos).toEqual({ x: 10, y: 20, z: 1 });
  });

  it('uses domElement override when provided', () => {
    const overrideElement = document.createElement('div');
    const groupMock = {} as never;

    renderHook(() => {
      const groupRef = useRef(groupMock);
      return useZUI(groupRef, { domElement: overrideElement });
    });

    expect(MockZUI).toHaveBeenCalledWith(groupMock, overrideElement);
  });

  it('attaches wheel event listener when enableWheel is true', () => {
    const addEventSpy = vi.spyOn(mockDomElement, 'addEventListener');
    const groupMock = {} as never;

    renderHook(() => {
      const groupRef = useRef(groupMock);
      return useZUI(groupRef, { enableWheel: true });
    });

    expect(addEventSpy).toHaveBeenCalledWith(
      'wheel',
      expect.any(Function),
      expect.objectContaining({ passive: false })
    );
  });

  it('does not attach wheel event listener when enableWheel is false', () => {
    const addEventSpy = vi.spyOn(mockDomElement, 'addEventListener');
    const groupMock = {} as never;

    renderHook(() => {
      const groupRef = useRef(groupMock);
      return useZUI(groupRef, { enableWheel: false });
    });

    const wheelCalls = addEventSpy.mock.calls.filter(
      (call) => call[0] === 'wheel'
    );
    expect(wheelCalls).toHaveLength(0);
  });

  it('attaches mouse event listeners when enableMouse is true', () => {
    const addEventSpy = vi.spyOn(mockDomElement, 'addEventListener');
    const groupMock = {} as never;

    renderHook(() => {
      const groupRef = useRef(groupMock);
      return useZUI(groupRef, { enableMouse: true });
    });

    expect(addEventSpy).toHaveBeenCalledWith(
      'mousedown',
      expect.any(Function)
    );
    expect(addEventSpy).toHaveBeenCalledWith(
      'mousemove',
      expect.any(Function)
    );
    expect(addEventSpy).toHaveBeenCalledWith('mouseup', expect.any(Function));
  });

  it('does not attach mouse event listeners when enableMouse is false', () => {
    const addEventSpy = vi.spyOn(mockDomElement, 'addEventListener');
    const groupMock = {} as never;

    renderHook(() => {
      const groupRef = useRef(groupMock);
      return useZUI(groupRef, { enableMouse: false });
    });

    const mouseEvents = addEventSpy.mock.calls
      .map((call) => call[0])
      .filter((e) => ['mousedown', 'mousemove', 'mouseup'].includes(e as string));
    expect(mouseEvents).toHaveLength(0);
  });

  it('attaches touch event listeners when enableTouch is true', () => {
    const addEventSpy = vi.spyOn(mockDomElement, 'addEventListener');
    const groupMock = {} as never;

    renderHook(() => {
      const groupRef = useRef(groupMock);
      return useZUI(groupRef, { enableTouch: true });
    });

    expect(addEventSpy).toHaveBeenCalledWith(
      'touchstart',
      expect.any(Function),
      expect.objectContaining({ passive: false })
    );
    expect(addEventSpy).toHaveBeenCalledWith(
      'touchmove',
      expect.any(Function),
      expect.objectContaining({ passive: false })
    );
    expect(addEventSpy).toHaveBeenCalledWith(
      'touchend',
      expect.any(Function)
    );
  });

  it('cleans up event listeners on unmount', () => {
    const removeEventSpy = vi.spyOn(mockDomElement, 'removeEventListener');
    const groupMock = {} as never;

    const { unmount } = renderHook(() => {
      const groupRef = useRef(groupMock);
      return useZUI(groupRef);
    });

    unmount();

    // Should have removed wheel, mouse, touch listeners
    expect(removeEventSpy).toHaveBeenCalledWith('wheel', expect.any(Function));
    expect(removeEventSpy).toHaveBeenCalledWith(
      'mousedown',
      expect.any(Function)
    );
    expect(removeEventSpy).toHaveBeenCalledWith(
      'touchstart',
      expect.any(Function)
    );
  });

  it('exposes the ZUI instance after initialization', async () => {
    const groupMock = {} as never;
    const { result } = renderHook(() => {
      const groupRef = useRef(groupMock);
      return useZUI(groupRef);
    });

    // Wait for the initialization effect to run
    await act(async () => {});

    expect(result.current.instance).toBe(mockZuiInstance);
  });
});
