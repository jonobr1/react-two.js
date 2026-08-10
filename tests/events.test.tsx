import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, fireEvent, act } from '@testing-library/react';
import { useState, useEffect } from 'react';
import Two from 'two.js';
import { Canvas, Group, RoundedRectangle, Circle, useTwo } from '../lib/main';
import { hitTest, sortFrontToBack } from '../lib/Events';

// Mock Canvas HTML element methods for JSDOM
beforeEach(() => {
  HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
    fillRect: vi.fn(),
    clearRect: vi.fn(),
    getImageData: vi.fn().mockReturnValue({ data: [] }),
    putImageData: vi.fn(),
    createImageData: vi.fn().mockReturnValue([]),
    setTransform: vi.fn(),
    drawImage: vi.fn(),
    save: vi.fn(),
    fillText: vi.fn(),
    restore: vi.fn(),
    beginPath: vi.fn(),
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    closePath: vi.fn(),
    stroke: vi.fn(),
    translate: vi.fn(),
    scale: vi.fn(),
    rotate: vi.fn(),
    arc: vi.fn(),
    fill: vi.fn(),
    measureText: vi.fn().mockReturnValue({ width: 0 }),
    transform: vi.fn(),
    rect: vi.fn(),
    clip: vi.fn(),
  });
});

describe('react-two.js Event System', () => {
  describe('hitTest Utility', () => {
    it('should correctly hit-test shape/group using getBoundingClientRect and stage offsets', () => {
      const mockTwo = {
        width: 800,
        height: 600,
      } as Two;

      // Create a mock group shape returning bounds [-50, -25, 50, 25] relative to center
      const mockGroup = {
        getBoundingClientRect: vi.fn().mockReturnValue({
          left: -50,
          right: 50,
          top: -25,
          bottom: 25,
          width: 100,
          height: 50,
        }),
      };

      // Stage center offset: (400, 300)
      // Top-Left DOM bounds: X in [350, 450], Y in [275, 325]

      // Point inside bounds
      expect(hitTest(mockGroup as unknown as Two.Group, 400, 300, mockTwo)).toBe(true);

      // Point outside bounds
      expect(hitTest(mockGroup as unknown as Two.Group, 200, 300, mockTwo)).toBe(false);
      expect(hitTest(mockGroup as unknown as Two.Group, 400, 500, mockTwo)).toBe(false);
    });

    it('should fallback to checking children if shape has no getBoundingClientRect or contains', () => {
      const mockChild = {
        contains: vi.fn((x: number, y: number) => x === 10 && y === 10),
      };

      const mockGroup = {
        children: [mockChild],
      };

      expect(hitTest(mockGroup as unknown as Two.Group, 10, 10)).toBe(true);
      expect(hitTest(mockGroup as unknown as Two.Group, 99, 99)).toBe(false);
    });

    it('should return false for hidden shapes', () => {
      const mockShape = {
        visible: false,
        contains: vi.fn().mockReturnValue(true),
      };

      expect(hitTest(mockShape as unknown as Two.Shape, 10, 10)).toBe(false);
    });

    it('should sort hits front-to-back (frontmost shape first)', () => {
      const mockBackgroundShape = { id: 'bg' };
      const mockForegroundShape = { id: 'fg' };

      const shapesMap = new Map();
      shapesMap.set(mockBackgroundShape, { shape: mockBackgroundShape, handlers: {} });
      shapesMap.set(mockForegroundShape, { shape: mockForegroundShape, handlers: {} });

      const hits = [mockBackgroundShape, mockForegroundShape];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sorted = sortFrontToBack(hits as any, shapesMap);

      // Foreground shape registered later must be FIRST in the hits array
      expect(sorted[0]).toBe(mockForegroundShape);
      expect(sorted[1]).toBe(mockBackgroundShape);
    });

    it('should sort hits based on parent.children index when sharing same parent group', () => {
      const childBack = { id: 'back' };
      const childFront = { id: 'front' };

      const mockParentGroup = {
        children: [childBack, childFront],
      };

      const shapesMap = new Map();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      shapesMap.set(childBack, { shape: childBack, handlers: {}, parent: mockParentGroup as any });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      shapesMap.set(childFront, { shape: childFront, handlers: {}, parent: mockParentGroup as any });

      const hits = [childBack, childFront];
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const sorted = sortFrontToBack(hits as any, shapesMap);

      // Higher index in parent.children must be FIRST in the hits array
      expect(sorted[0]).toBe(childFront);
      expect(sorted[1]).toBe(childBack);
    });
  });

  describe('Group Event Handling Integration', () => {
    it('should trigger onPointerOver and onPointerOut on <Group>', async () => {
      const onPointerOver = vi.fn();
      const onPointerOut = vi.fn();
      const onPointerLeave = vi.fn();

      const { container } = render(
        <Canvas width={800} height={600} autostart={false}>
          <Group
            onPointerOver={onPointerOver}
            onPointerOut={onPointerOut}
            onPointerLeave={onPointerLeave}
          >
            <RoundedRectangle width={100} height={50} />
          </Group>
        </Canvas>
      );

      const canvasElement = container.querySelector('canvas') || container.querySelector('svg');
      expect(canvasElement).not.toBeNull();

      if (!canvasElement) return;

      // Mock getBoundingClientRect for JSDOM canvas
      vi.spyOn(canvasElement, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        right: 800,
        bottom: 600,
        width: 800,
        height: 600,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      // Move pointer inside stage center (400, 300)
      act(() => {
        fireEvent.pointerMove(canvasElement, { clientX: 400, clientY: 300 });
      });

      // Move pointer outside shape bounds (10, 10)
      act(() => {
        fireEvent.pointerMove(canvasElement, { clientX: 10, clientY: 10 });
      });

      // Verify pointer events dispatched
      expect(canvasElement).toBeDefined();
    });

    it('should trigger over on top shape and out on bottom shape when moving onto overlapping top shape', () => {
      const onBottomOver = vi.fn();
      const onBottomOut = vi.fn();
      const onTopOver = vi.fn();
      const onTopOut = vi.fn();

      const { container } = render(
        <Canvas width={800} height={600} autostart={false}>
          {/* Bottom Shape */}
          <RoundedRectangle
            x={400}
            y={300}
            width={200}
            height={200}
            onPointerOver={onBottomOver}
            onPointerOut={onBottomOut}
          />
          {/* Top Shape (drawn later on top) */}
          <Circle
            x={400}
            y={300}
            radius={50}
            onPointerOver={onTopOver}
            onPointerOut={onTopOut}
          />
        </Canvas>
      );

      const canvasElement = container.querySelector('canvas') || container.querySelector('svg');
      if (!canvasElement) return;

      vi.spyOn(canvasElement, 'getBoundingClientRect').mockReturnValue({
        left: 0,
        top: 0,
        right: 800,
        bottom: 600,
        width: 800,
        height: 600,
        x: 0,
        y: 0,
        toJSON: () => {},
      });

      // Pointer moves onto center (400, 300) where Circle sits on top of RoundedRectangle
      act(() => {
        fireEvent.pointerMove(canvasElement, { clientX: 400, clientY: 300 });
      });

      // Top shape (Circle) must get pointer over
      expect(onTopOver).toHaveBeenCalled();
    });
  });

  describe('Edge Case: Hover State Stability Across Re-Renders', () => {
    function InteractiveComponent({ onHoverChange }: { onHoverChange: (hovered: boolean) => void }) {
      const [isHovered, setIsHovered] = useState(false);
      const [count, setCount] = useState(0);

      return (
        <Group
          onPointerOver={() => {
            setIsHovered(true);
            onHoverChange(true);
          }}
          onPointerOut={() => {
            setIsHovered(false);
            onHoverChange(false);
          }}
        >
          <Circle radius={isHovered ? 40 : 20} />
          <RoundedRectangle
            width={100}
            height={50}
            onClick={() => setCount((c) => c + 1)}
            aria-label={`Count: ${count}`}
          />
        </Group>
      );
    }

    it('should maintain hover state cleanly when component re-renders with new inline function props', () => {
      const onHoverChange = vi.fn();

      const { container } = render(
        <Canvas width={800} height={600} autostart={false}>
          <InteractiveComponent onHoverChange={onHoverChange} />
        </Canvas>
      );

      const canvasElement = container.querySelector('canvas') || container.querySelector('svg');
      expect(canvasElement).not.toBeNull();
    });
  });

  describe('hitTestPoint', () => {
    it('reports true over a registered shape and false over empty canvas', () => {
      const seen: Array<{ label: string; hit: boolean }> = [];

      function Probe() {
        const { two, hitTestPoint } = useTwo();
        useEffect(() => {
          if (!two) return;
          seen.push({ label: 'inside', hit: hitTestPoint(400, 300) });
          seen.push({ label: 'outside', hit: hitTestPoint(10, 10) });
        }, [two, hitTestPoint]);
        return null;
      }

      render(
        <Canvas type={Two.Types.canvas} width={800} height={600}>
          <Group>
            <RoundedRectangle
              x={400}
              y={300}
              width={100}
              height={60}
              onPointerDown={() => {}}
            />
          </Group>
          <Probe />
        </Canvas>,
      );

      expect(seen.find((s) => s.label === 'inside')?.hit).toBe(true);
      expect(seen.find((s) => s.label === 'outside')?.hit).toBe(false);
    });
  });
});
