import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, act } from '@testing-library/react';
import { useEffect, useRef } from 'react';
import Two from 'two.js';
import { Canvas, Group, Circle, useZUI, useTwo, type RefGroup, type ZUIControls } from '../lib/main';

beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    fillRect: vi.fn(), clearRect: vi.fn(), getImageData: vi.fn().mockReturnValue({ data: [] }),
    putImageData: vi.fn(), createImageData: vi.fn().mockReturnValue([]), setTransform: vi.fn(),
    drawImage: vi.fn(), save: vi.fn(), fillText: vi.fn(), restore: vi.fn(), beginPath: vi.fn(),
    moveTo: vi.fn(), lineTo: vi.fn(), closePath: vi.fn(), stroke: vi.fn(), translate: vi.fn(),
    scale: vi.fn(), rotate: vi.fn(), arc: vi.fn(), fill: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 0 }), transform: vi.fn(), rect: vi.fn(), clip: vi.fn(),
  });
});

/** Renders a ZUI-managed group and hands the controls back to the test. */
function Harness({
  onReady,
  withShape = false,
}: {
  onReady: (controls: ZUIControls, canvas: HTMLElement) => void;
  withShape?: boolean;
}) {
  const groupRef = useRef<RefGroup | null>(null);
  const controls = useZUI(groupRef, { minZoom: 0.25, maxZoom: 8 });
  const { two } = useTwo();

  useEffect(() => {
    const canvas = document.querySelector('canvas');
    if (canvas) onReady(controls, canvas);
  }, [two, controls, onReady]);

  return (
    <Group ref={groupRef}>
      {withShape ? (
        <Circle x={400} y={300} radius={50} onPointerDown={() => {}} />
      ) : (
        <Circle x={400} y={300} radius={50} />
      )}
    </Group>
  );
}

function renderHarness(withShape = false) {
  const captured: { controls?: ZUIControls; canvas?: HTMLElement } = {};
  render(
    <Canvas type={Two.Types.canvas} width={800} height={600}>
      <Harness
        withShape={withShape}
        onReady={(controls, canvas) => {
          captured.controls = controls;
          captured.canvas = canvas;
        }}
      />
    </Canvas>,
  );
  return captured as { controls: ZUIControls; canvas: HTMLElement };
}

function pointer(type: string, init: Partial<PointerEventInit>) {
  return new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    pointerId: 1,
    isPrimary: true,
    button: 0,
    buttons: type === 'pointerup' ? 0 : 1,
    ...init,
  });
}

describe('useZUI', () => {
  it('starts at scale 1 with an identity surface', () => {
    const { controls } = renderHarness();
    expect(controls.state.current.scale).toBe(1);
    expect(controls.state.current.zoom).toBe(0);
    expect(controls.state.current.x).toBe(0);
    expect(controls.state.current.y).toBe(0);
  });

  it('exposes the ZUI instance via a ref, not a render-time value', () => {
    const { controls } = renderHarness();
    expect(controls.instance.current).not.toBeNull();
  });

  it('applies the zoom to the target group scale', () => {
    const { controls } = renderHarness();
    act(() => {
      controls.zoomBy(Math.LN2, 400, 300);
    });
    expect(controls.state.current.scale).toBeCloseTo(2, 5);
  });

  it('clamps zoom to maxZoom', () => {
    const { controls } = renderHarness();
    act(() => {
      controls.zoomBy(100, 400, 300);
    });
    expect(controls.state.current.scale).toBeCloseTo(8, 5);
  });

  it('clamps zoom to minZoom', () => {
    const { controls } = renderHarness();
    act(() => {
      controls.zoomBy(-100, 400, 300);
    });
    expect(controls.state.current.scale).toBeCloseTo(0.25, 5);
  });

  it('pans on a background drag', () => {
    const { controls, canvas } = renderHarness(false);
    act(() => {
      canvas.dispatchEvent(pointer('pointerdown', { clientX: 10, clientY: 10 }));
      window.dispatchEvent(pointer('pointermove', { clientX: 60, clientY: 40 }));
      window.dispatchEvent(pointer('pointerup', { clientX: 60, clientY: 40 }));
    });
    expect(controls.state.current.x).toBeCloseTo(50, 5);
    expect(controls.state.current.y).toBeCloseTo(30, 5);
  });

  it('does NOT pan when the pointerdown lands on a registered shape', () => {
    const { controls, canvas } = renderHarness(true);
    act(() => {
      canvas.dispatchEvent(pointer('pointerdown', { clientX: 400, clientY: 300 }));
      window.dispatchEvent(pointer('pointermove', { clientX: 450, clientY: 330 }));
      window.dispatchEvent(pointer('pointerup', { clientX: 450, clientY: 330 }));
    });
    expect(controls.state.current.x).toBe(0);
    expect(controls.state.current.y).toBe(0);
  });

  it('ends a pan on pointercancel', () => {
    const { controls, canvas } = renderHarness(false);
    act(() => {
      canvas.dispatchEvent(pointer('pointerdown', { clientX: 10, clientY: 10 }));
      window.dispatchEvent(pointer('pointercancel', { clientX: 10, clientY: 10 }));
      window.dispatchEvent(pointer('pointermove', { clientX: 200, clientY: 200 }));
    });
    expect(controls.state.current.x).toBe(0);
  });

  it('zooms on wheel toward the cursor', () => {
    const { controls, canvas } = renderHarness();
    act(() => {
      canvas.dispatchEvent(
        new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -100, deltaMode: 0, clientX: 400, clientY: 300 }),
      );
    });
    expect(controls.state.current.scale).toBeGreaterThan(1);
  });

  it('resets back to the identity surface', () => {
    const { controls } = renderHarness();
    act(() => {
      controls.zoomBy(1, 400, 300);
      controls.panBy(25, 25);
      controls.reset();
    });
    expect(controls.state.current.scale).toBe(1);
    expect(controls.state.current.x).toBe(0);
    expect(controls.state.current.y).toBe(0);
  });

  it('round-trips client and surface coordinates', () => {
    const { controls } = renderHarness();
    act(() => {
      controls.zoomBy(0.5, 400, 300);
      controls.panBy(40, -20);
    });
    const surface = controls.clientToSurface(250, 175);
    const client = controls.surfaceToClient(surface.x, surface.y);
    expect(client.x).toBeCloseTo(250, 4);
    expect(client.y).toBeCloseTo(175, 4);
  });

  it('honours panBounds', () => {
    const captured: { controls?: ZUIControls } = {};
    function Bounded() {
      const groupRef = useRef<RefGroup | null>(null);
      captured.controls = useZUI(groupRef, { panBounds: { x: [-50, 50], y: [-50, 50] } });
      return <Group ref={groupRef} />;
    }
    render(
      <Canvas type={Two.Types.canvas} width={800} height={600}>
        <Bounded />
      </Canvas>,
    );
    act(() => {
      captured.controls!.panBy(500, 500);
    });
    expect(captured.controls!.state.current.x).toBe(50);
    expect(captured.controls!.state.current.y).toBe(50);
  });

  describe('surface-space drag deltas', () => {
    it('maps screen pixels one-for-one at scale 1', () => {
      const { controls } = renderHarness();
      const a = controls.clientToSurface(100, 100);
      const b = controls.clientToSurface(200, 160);
      expect(b.x - a.x).toBeCloseTo(100, 5);
      expect(b.y - a.y).toBeCloseTo(60, 5);
    });

    it('halves the surface delta at scale 2', () => {
      const { controls } = renderHarness();
      act(() => {
        controls.zoomBy(Math.LN2, 400, 300);
      });
      expect(controls.state.current.scale).toBeCloseTo(2, 5);

      const a = controls.clientToSurface(100, 100);
      const b = controls.clientToSurface(200, 100);
      expect(b.x - a.x).toBeCloseTo(50, 5);
    });

    it('doubles the surface delta at scale 0.5', () => {
      const { controls } = renderHarness();
      act(() => {
        controls.zoomBy(-Math.LN2, 400, 300);
      });
      expect(controls.state.current.scale).toBeCloseTo(0.5, 5);

      const a = controls.clientToSurface(100, 100);
      const b = controls.clientToSurface(200, 100);
      expect(b.x - a.x).toBeCloseTo(200, 5);
    });

    it('is unaffected by panning', () => {
      const { controls } = renderHarness();
      act(() => {
        controls.zoomBy(Math.LN2, 400, 300);
        controls.panBy(123, -45);
      });
      const a = controls.clientToSurface(100, 100);
      const b = controls.clientToSurface(200, 100);
      expect(b.x - a.x).toBeCloseTo(50, 5);
    });
  });
});
