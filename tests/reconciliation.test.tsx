import { describe, it, expect, vi, beforeEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import Two from 'two.js';
import {
  Canvas,
  Group,
  Circle,
  Rectangle,
  Polygon,
  Text,
  Line,
  LinearGradient,
  RadialGradient,
  useTwo,
  type RefCircle,
  type RefGroup,
  type RefRectangle,
  type RefPolygon,
  type RefLine,
  type RefLinearGradient,
  type RefRadialGradient,
  type VectorProp,
  type ScaleProp,
} from '../lib/main';
import { TwoParentContext } from '../lib/Context';
import { TWO_DEFAULT_PROPS } from '../lib/reconciliation';

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

describe('Two.js Scene Graph Reconciliation (Issue #29)', () => {
  describe('1. Initial Mount & Order', () => {
    it('mounts children into parent.children in JSX document order', () => {
      const groupRef = React.createRef<RefGroup>();
      const circleRef = React.createRef<RefCircle>();
      const rectRef = React.createRef<RefRectangle>();
      const polyRef = React.createRef<RefPolygon>();

      render(
        <Canvas width={800} height={600}>
          <Group ref={groupRef}>
            <Circle ref={circleRef} key="circle" radius={20} />
            <Rectangle ref={rectRef} key="rect" width={50} height={50} />
            <Polygon ref={polyRef} key="poly" radius={30} sides={5} />
          </Group>
        </Canvas>
      );

      const group = groupRef.current!;
      expect(group).not.toBeNull();
      expect(group.children.length).toBe(3);
      expect(group.children[0]).toBe(circleRef.current);
      expect(group.children[1]).toBe(rectRef.current);
      expect(group.children[2]).toBe(polyRef.current);
    });
  });

  describe('2. Sibling Reordering', () => {
    it('reorders parent.children when keyed JSX siblings reorder', () => {
      const groupRef = React.createRef<RefGroup>();
      const refs: Record<string, RefCircle> = {};

      function Item({ id }: { id: string }) {
        return (
          <Circle
            key={id}
            ref={(el) => {
              if (el) refs[id] = el;
            }}
            radius={10}
          />
        );
      }

      function App({ order }: { order: string[] }) {
        return (
          <Canvas width={800} height={600}>
            <Group ref={groupRef}>
              {order.map((id) => (
                <Item key={id} id={id} />
              ))}
            </Group>
          </Canvas>
        );
      }

      const { rerender } = render(<App order={['a', 'b', 'c']} />);
      const group = groupRef.current!;

      expect(group.children.map((c: { id: string }) => c.id)).toEqual([
        refs['a'].id,
        refs['b'].id,
        refs['c'].id,
      ]);

      // Reorder to ['c', 'a', 'b']
      rerender(<App order={['c', 'a', 'b']} />);

      expect(group.children.map((c: { id: string }) => c.id)).toEqual([
        refs['c'].id,
        refs['a'].id,
        refs['b'].id,
      ]);

      // Reorder to ['b', 'c', 'a']
      rerender(<App order={['b', 'c', 'a']} />);

      expect(group.children.map((c: { id: string }) => c.id)).toEqual([
        refs['b'].id,
        refs['c'].id,
        refs['a'].id,
      ]);
    });

    it('reorders parent.children even when sibling components are wrapped in React.memo', () => {
      const groupRef = React.createRef<RefGroup>();
      const refs: Record<string, RefCircle> = {};

      const MemoItem = React.memo(({ id }: { id: string }) => {
        return (
          <Circle
            key={id}
            ref={(el) => {
              if (el) refs[id] = el;
            }}
            radius={15}
          />
        );
      });

      function App({ order }: { order: string[] }) {
        return (
          <Canvas width={800} height={600}>
            <Group ref={groupRef}>
              {order.map((id) => (
                <MemoItem key={id} id={id} />
              ))}
            </Group>
          </Canvas>
        );
      }

      const { rerender } = render(<App order={['x', 'y', 'z']} />);
      const group = groupRef.current!;

      expect(group.children.map((c: { id: string }) => c.id)).toEqual([
        refs['x'].id,
        refs['y'].id,
        refs['z'].id,
      ]);

      // Reorder memoized siblings
      rerender(<App order={['z', 'x', 'y']} />);

      expect(group.children.map((c: { id: string }) => c.id)).toEqual([
        refs['z'].id,
        refs['x'].id,
        refs['y'].id,
      ]);
    });
  });

  describe('3. Reparenting', () => {
    it('moves a keyed object between groups, removing from old parent and inserting into new parent', () => {
      const g1Ref = React.createRef<RefGroup>();
      const g2Ref = React.createRef<RefGroup>();
      const circleRef = React.createRef<RefCircle>();

      function App({ targetGroup }: { targetGroup: 'g1' | 'g2' }) {
        return (
          <Canvas width={800} height={600}>
            <Group ref={g1Ref}>
              <Rectangle width={40} height={40} />
              {targetGroup === 'g1' && (
                <Circle ref={circleRef} key="shared-circle" radius={10} />
              )}
            </Group>
            <Group ref={g2Ref}>
              <Rectangle width={60} height={60} />
              {targetGroup === 'g2' && (
                <Circle ref={circleRef} key="shared-circle" radius={10} />
              )}
              <Rectangle width={80} height={80} />
            </Group>
          </Canvas>
        );
      }

      const { rerender } = render(<App targetGroup="g1" />);
      const g1 = g1Ref.current!;
      const g2 = g2Ref.current!;
      const circle1 = circleRef.current!;

      expect(g1.children).toContain(circle1);
      expect(g2.children).not.toContain(circle1);
      expect(circle1.parent).toBe(g1);

      // Move circle from g1 to g2
      rerender(<App targetGroup="g2" />);
      const circle2 = circleRef.current!;

      expect(g1.children).not.toContain(circle1);
      expect(g2.children).toContain(circle2);
      expect(circle2.parent).toBe(g2);
      // It should be at index 1 between the two rectangles
      expect(g2.children[1]).toBe(circle2);
    });

    it('reparents the same component instance when parent context changes dynamically', () => {
      const circleRef = React.createRef<RefCircle>();
      const g1 = new Two.Group();
      const g2 = new Two.Group();

      function App({ parentGroup }: { parentGroup: Two.Group }) {
        return (
          <Canvas width={800} height={600}>
            <TwoParentContext.Provider value={{ parent: parentGroup }}>
              <Circle ref={circleRef} radius={10} />
            </TwoParentContext.Provider>
          </Canvas>
        );
      }

      const { rerender } = render(<App parentGroup={g1} />);
      const circle = circleRef.current!;

      expect(g1.children).toContain(circle);
      expect(g2.children).not.toContain(circle);
      expect(circle.parent).toBe(g1);

      // Change parent to g2 without unmounting Circle
      rerender(<App parentGroup={g2} />);

      expect(circleRef.current).toBe(circle); // Same instance!
      expect(g1.children).not.toContain(circle);
      expect(g2.children).toContain(circle);
      expect(circle.parent).toBe(g2);
    });

    it('detaches old instance from previous parent when recreation coincides with parent change', () => {
      const circleRef = React.createRef<RefCircle>();
      const g1 = new Two.Group();
      const g2 = new Two.Group();

      function App({ parentGroup, resolution }: { parentGroup: Two.Group; resolution: number }) {
        return (
          <Canvas width={800} height={600}>
            <TwoParentContext.Provider value={{ parent: parentGroup }}>
              <Circle ref={circleRef} radius={10} resolution={resolution} />
            </TwoParentContext.Provider>
          </Canvas>
        );
      }

      const { rerender } = render(<App parentGroup={g1} resolution={12} />);
      const oldCircle = circleRef.current!;

      expect(g1.children).toContain(oldCircle);
      expect(g2.children).not.toContain(oldCircle);
      expect(oldCircle.parent).toBe(g1);

      // Simultaneously change parent to g2 AND change construction-only prop resolution (12 -> 36)
      rerender(<App parentGroup={g2} resolution={36} />);
      const newCircle = circleRef.current!;

      expect(newCircle).not.toBe(oldCircle);
      // Old circle must be cleanly detached from g1 and not orphaned!
      expect(g1.children).not.toContain(oldCircle);
      expect(g1.children).toHaveLength(0);
      // New circle must be attached to g2
      expect(g2.children).toContain(newCircle);
      expect(newCircle.parent).toBe(g2);
    });
  });

  describe('4. Discrete Prop Updates', () => {
    it('updates only changed properties without reassigning unchanged properties', () => {
      const circleRef = React.createRef<RefCircle>();

      function App({ x, fill }: { x: number; fill: string }) {
        return (
          <Canvas width={800} height={600}>
            <Circle ref={circleRef} x={x} y={50} fill={fill} stroke="#333" />
          </Canvas>
        );
      }

      const { rerender } = render(<App x={100} fill="red" />);
      const circle = circleRef.current!;

      expect(circle.translation.x).toBe(100);
      expect(circle.translation.y).toBe(50);
      expect(circle.fill).toBe('red');
      expect(circle.stroke).toBe('#333');

      // Clear Two.js internal dirty flags
      circle._flagStroke = false;
      circle._flagFill = false;

      // Update only x (position)
      rerender(<App x={150} fill="red" />);

      expect(circle.translation.x).toBe(150);
      expect(circle.fill).toBe('red');
      // Neither fill nor stroke were reassigned
      expect(circle._flagStroke).toBe(false);
      expect(circle._flagFill).toBe(false);
    });
  });

  describe('5. Prop Removal & Reset Semantics', () => {
    it('restores Two.js default values when props are removed or set to undefined', () => {
      const circleRef = React.createRef<RefCircle>();

      interface ShapeProps {
        x?: number;
        y?: number;
        fill?: string;
        stroke?: string;
        linewidth?: number;
        opacity?: number;
      }

      function App({ shapeProps }: { shapeProps: ShapeProps }) {
        return (
          <Canvas width={800} height={600}>
            <Circle ref={circleRef} {...shapeProps} />
          </Canvas>
        );
      }

      const { rerender } = render(
        <App
          shapeProps={{
            x: 200,
            y: 300,
            fill: '#ff0000',
            stroke: '#00ff00',
            linewidth: 10,
            opacity: 0.4,
          }}
        />
      );

      const circle = circleRef.current!;
      expect(circle.translation.x).toBe(200);
      expect(circle.translation.y).toBe(300);
      expect(circle.fill).toBe('#ff0000');
      expect(circle.stroke).toBe('#00ff00');
      expect(circle.linewidth).toBe(10);
      expect(circle.opacity).toBe(0.4);

      // Now remove fill, stroke, linewidth, opacity, and position
      rerender(<App shapeProps={{}} />);

      expect(circle.translation.x).toBe(0);
      expect(circle.translation.y).toBe(0);
      expect(circle.fill).toBe(TWO_DEFAULT_PROPS.fill);
      expect(circle.stroke).toBe(TWO_DEFAULT_PROPS.stroke);
      expect(circle.linewidth).toBe(TWO_DEFAULT_PROPS.linewidth);
      expect(circle.opacity).toBe(TWO_DEFAULT_PROPS.opacity);
    });

    it('restores default values on Text component when props are removed', () => {
      const textRef = React.createRef<Two.Text>();

      function App({ value, size }: { value?: string; size?: number }) {
        return (
          <Canvas width={800} height={600}>
            <Text ref={textRef} value={value} size={size} />
          </Canvas>
        );
      }

      const { rerender } = render(<App value="Hello World" size={32} />);
      const text = textRef.current!;

      expect(text.value).toBe('Hello World');
      expect(text.size).toBe(32);

      // Remove size prop
      rerender(<App value="Hello World" />);
      expect(text.value).toBe('Hello World');
      expect(text.size).toBe(TWO_DEFAULT_PROPS.size);

      // Remove value prop
      rerender(<App />);
      expect(text.value).toBe(TWO_DEFAULT_PROPS.value);
    });
  });

  describe('6. Construction-Only Prop Replacement', () => {
    it('recreates instance safely in-place at the exact child index when construction props change', () => {
      const groupRef = React.createRef<RefGroup>();
      const circleRef = React.createRef<RefCircle>();

      function App({ resolution }: { resolution: number }) {
        return (
          <Canvas width={800} height={600}>
            <Group ref={groupRef}>
              <Rectangle key="first" width={50} height={50} />
              <Circle
                key="middle"
                ref={circleRef}
                radius={25}
                resolution={resolution}
                fill="orange"
              />
              <Rectangle key="last" width={70} height={70} />
            </Group>
          </Canvas>
        );
      }

      const { rerender } = render(<App resolution={12} />);
      const group = groupRef.current!;
      const oldCircle = circleRef.current!;

      expect(group.children[1]).toBe(oldCircle);
      expect(oldCircle.fill).toBe('orange');

      // Change construction prop (resolution 12 -> 36)
      rerender(<App resolution={36} />);
      const newCircle = circleRef.current!;

      expect(newCircle).not.toBe(oldCircle);
      expect(group.children.length).toBe(3);
      // Replaced in-place at exact child index 1 between the two rectangles!
      expect(group.children[1]).toBe(newCircle);
      expect(newCircle.fill).toBe('orange');

      // Subsequent recreation (36 -> 48) also keeps the exact same position
      rerender(<App resolution={48} />);
      const thirdCircle = circleRef.current!;

      expect(thirdCircle).not.toBe(newCircle);
      expect(group.children.length).toBe(3);
      expect(group.children[1]).toBe(thirdCircle);
    });

    it('defers instance replacement and disposal to commit phase rather than render phase', () => {
      const groupRef = React.createRef<RefGroup>();
      let renderPhaseChildrenLengthDuringRecreation = -1;

      function Observer({ resolution }: { resolution: number }) {
        // Inspect parent group during render phase
        const group = groupRef.current;
        if (group && resolution > 12) {
          renderPhaseChildrenLengthDuringRecreation = group.children.length;
        }
        return (
          <Circle
            key="obs-circle"
            radius={20}
            resolution={resolution}
          />
        );
      }

      function App({ resolution }: { resolution: number }) {
        return (
          <Canvas width={800} height={600}>
            <Group ref={groupRef}>
              <Rectangle width={30} height={30} />
              <Observer resolution={resolution} />
              <Rectangle width={40} height={40} />
            </Group>
          </Canvas>
        );
      }

      const { rerender } = render(<App resolution={12} />);
      const group = groupRef.current!;
      expect(group.children.length).toBe(3);

      rerender(<App resolution={24} />);
      // During render phase of recreation, group.children was NOT mutated or duplicated
      expect(renderPhaseChildrenLengthDuringRecreation).toBe(3);
      expect(group.children.length).toBe(3);
    });
  });

  describe('7. Strict Mode & Resource Lifecycle', () => {
    it('handles StrictMode double-mount without leaking duplicate children or event handlers', () => {
      const probe: { hitTestPoint?: (x: number, y: number) => boolean } = {};

      function Probe() {
        const { hitTestPoint } = useTwo();
        probe.hitTestPoint = hitTestPoint;
        return null;
      }

      const groupRef = React.createRef<RefGroup>();

      render(
        <React.StrictMode>
          <Canvas type={Two.Types.canvas} width={800} height={600}>
            <Group ref={groupRef}>
              <Circle
                x={400}
                y={300}
                radius={50}
                onPointerDown={() => {}}
              />
            </Group>
            <Probe />
          </Canvas>
        </React.StrictMode>
      );

      const group = groupRef.current!;
      expect(group.children.length).toBe(1);
      expect(probe.hitTestPoint!(400, 300)).toBe(true);
      expect(probe.hitTestPoint!(10, 10)).toBe(false);
    });

    it('unmounts cleanly and unregisters handlers', () => {
      const probe: { hitTestPoint?: (x: number, y: number) => boolean } = {};

      function Probe() {
        const { hitTestPoint } = useTwo();
        probe.hitTestPoint = hitTestPoint;
        return null;
      }

      function App({ show }: { show: boolean }) {
        return (
          <Canvas type={Two.Types.canvas} width={800} height={600}>
            {show && (
              <Circle
                x={400}
                y={300}
                radius={50}
                onPointerDown={() => {}}
              />
            )}
            <Probe />
          </Canvas>
        );
      }

      const { rerender } = render(<App show={true} />);
      expect(probe.hitTestPoint!(400, 300)).toBe(true);

      rerender(<App show={false} />);
      expect(probe.hitTestPoint!(400, 300)).toBe(false);
    });

    it('distinguishes owned resources from shared resources on unmount', () => {
      // Create a shared Texture instance outside of the shape
      const sharedTexture = new Two.Texture();
      let textureDisposed = false;

      // Wrap texture to detect if dispose was incorrectly called
      (sharedTexture as unknown as { dispose?: () => void }).dispose = () => {
        textureDisposed = true;
      };

      function App({ show }: { show: boolean }) {
        return (
          <Canvas width={800} height={600}>
            {show && <Circle radius={30} fill={sharedTexture} />}
          </Canvas>
        );
      }

      const { rerender } = render(<App show={true} />);
      // Unmount the shape
      rerender(<App show={false} />);

      // Shared texture must NOT be disposed
      expect(textureDisposed).toBe(false);
    });
  });

  describe('9. Extended Prop Normalization and Default Resets', () => {
    it('normalizes position and translation props (objects, tuples, Two.Vector) without throwing', () => {
      const circleRef = React.createRef<RefCircle>();

      function App({
        position,
        translation,
      }: {
        position?: VectorProp;
        translation?: VectorProp;
      }) {
        return (
          <Canvas width={800} height={600}>
            <Circle ref={circleRef} radius={25} position={position} translation={translation} />
          </Canvas>
        );
      }

      // Object literal
      const { rerender } = render(<App position={{ x: 120, y: 80 }} />);
      const circle = circleRef.current!;
      expect(circle.translation.x).toBe(120);
      expect(circle.translation.y).toBe(80);

      // Tuple
      rerender(<App translation={[45, 65]} />);
      expect(circle.translation.x).toBe(45);
      expect(circle.translation.y).toBe(65);

      // Two.Vector
      const v = new Two.Vector(200, 300);
      rerender(<App position={v} />);
      expect(circle.translation.x).toBe(200);
      expect(circle.translation.y).toBe(300);

      // Removal resets to (0, 0)
      rerender(<App />);
      expect(circle.translation.x).toBe(0);
      expect(circle.translation.y).toBe(0);
    });

    it('normalizes scale tuples and objects safely without matrix NaN', () => {
      const circleRef = React.createRef<RefCircle>();

      function App({ scale }: { scale?: ScaleProp }) {
        return (
          <Canvas width={800} height={600}>
            <Circle ref={circleRef} radius={25} scale={scale} />
          </Canvas>
        );
      }

      // Tuple scale
      const { rerender } = render(<App scale={[2, 3]} />);
      const circle = circleRef.current!;
      expect(circle.scale).toBeInstanceOf(Two.Vector);
      expect((circle.scale as Two.Vector).x).toBe(2);
      expect((circle.scale as Two.Vector).y).toBe(3);

      // Ensure _matrix update does not produce NaN
      const internalCircle = circle as unknown as {
        _update: () => void;
        _matrix: { elements: Float32Array };
      };
      internalCircle._update();
      for (const el of internalCircle._matrix.elements) {
        expect(Number.isNaN(el)).toBe(false);
      }

      // Object scale
      rerender(<App scale={{ x: 0.5, y: 1.5 }} />);
      expect((circle.scale as Two.Vector).x).toBe(0.5);
      expect((circle.scale as Two.Vector).y).toBe(1.5);
      internalCircle._update();
      for (const el of internalCircle._matrix.elements) {
        expect(Number.isNaN(el)).toBe(false);
      }

      // Scalar number scale
      rerender(<App scale={4} />);
      expect(circle.scale).toBe(4);

      // Removal resets to default scale 1
      rerender(<App />);
      expect(circle.scale).toBe(1);
    });

    it('resets removed properties to TWO_DEFAULT_PROPS (mask, clip, strokeAttenuation, skew)', () => {
      const circleRef = React.createRef<RefCircle>();
      const maskShape = new Two.Rectangle(0, 0, 50, 50);

      function App({
        mask,
        clip,
        strokeAttenuation,
        skewX,
        skewY,
      }: {
        mask?: Two.Shape | null;
        clip?: boolean;
        strokeAttenuation?: boolean;
        skewX?: number;
        skewY?: number;
      }) {
        return (
          <Canvas width={800} height={600}>
            <Circle
              ref={circleRef}
              radius={30}
              mask={mask}
              clip={clip}
              strokeAttenuation={strokeAttenuation}
              skewX={skewX}
              skewY={skewY}
            />
          </Canvas>
        );
      }

      const { rerender } = render(
        <App
          mask={maskShape}
          clip={true}
          strokeAttenuation={false}
          skewX={0.5}
          skewY={0.25}
        />
      );
      const circle = circleRef.current!;
      expect(circle.mask).toBe(maskShape);
      expect(circle.clip).toBe(true);
      expect(circle.strokeAttenuation).toBe(false);
      expect(circle.skewX).toBe(0.5);
      expect(circle.skewY).toBe(0.25);

      // Remove all props -> must reset to Two.js defaults!
      rerender(<App />);
      expect(circle.mask).toBeNull();
      expect(circle.clip).toBe(false);
      expect(circle.strokeAttenuation).toBe(true);
      expect(circle.skewX).toBe(0);
      expect(circle.skewY).toBe(0);
    });

    it('normalizes vector endpoints on Line, LinearGradient, and RadialGradient', () => {
      const lineRef = React.createRef<RefLine>();
      const linearRef = React.createRef<RefLinearGradient>();
      const radialRef = React.createRef<RefRadialGradient>();

      function App({
        lineLeft,
        lineRight,
        linearLeft,
        linearRight,
        radialCenter,
        radialFocal,
      }: {
        lineLeft?: VectorProp;
        lineRight?: VectorProp;
        linearLeft?: VectorProp;
        linearRight?: VectorProp;
        radialCenter?: VectorProp;
        radialFocal?: VectorProp;
      }) {
        return (
          <Canvas width={800} height={600}>
            <Line ref={lineRef} left={lineLeft} right={lineRight} />
            <LinearGradient ref={linearRef} left={linearLeft} right={linearRight} />
            <RadialGradient ref={radialRef} center={radialCenter} focal={radialFocal} />
          </Canvas>
        );
      }

      const { rerender } = render(
        <App
          lineLeft={{ x: 10, y: 20 }}
          lineRight={[100, 200]}
          linearLeft={[5, 10]}
          linearRight={{ x: 80, y: 90 }}
          radialCenter={{ x: 40, y: 50 }}
          radialFocal={[20, 30]}
        />
      );

      const line = lineRef.current!;
      expect(line.left.x).toBe(10);
      expect(line.left.y).toBe(20);
      expect(line.right.x).toBe(100);
      expect(line.right.y).toBe(200);

      const linear = linearRef.current!;
      expect(linear.left.x).toBe(5);
      expect(linear.left.y).toBe(10);
      expect(linear.right.x).toBe(80);
      expect(linear.right.y).toBe(90);

      const radial = radialRef.current!;
      expect(radial.center.x).toBe(40);
      expect(radial.center.y).toBe(50);
      expect(radial.focal.x).toBe(20);
      expect(radial.focal.y).toBe(30);

      // Removal resets
      rerender(<App />);
      expect(line.left.x).toBe(0);
      expect(line.left.y).toBe(0);
      expect(line.right.x).toBe(0);
      expect(line.right.y).toBe(0);
      expect(linear.left.x).toBe(0);
      expect(linear.left.y).toBe(0);
      expect(radial.center.x).toBe(0);
      expect(radial.center.y).toBe(0);
    });
  });
});
