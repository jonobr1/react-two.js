import { describe, it, expect } from 'vitest';
import { render, act } from '@testing-library/react';
import Two from 'two.js';
import { Canvas, useTwo } from '../lib/main';
import { WiremarkConnection } from '../src/playgrounds/wiremarks/components/WiremarkConnection';
import type {
  WiremarkEdge,
  WiremarkNode,
} from '../src/playgrounds/wiremarks/types';

const source: WiremarkNode = {
  id: 'a',
  name: 'A',
  x: 100,
  y: 100,
  width: 120,
  height: 60,
  colors: { fill: '#fff', stroke: '#000', textColor: '#000' },
};

const target: WiremarkNode = { ...source, id: 'b', name: 'B', x: 400, y: 300 };

const edge: WiremarkEdge = {
  id: 'a->b',
  sourceId: 'a',
  targetId: 'b',
  color: '#000',
};

const labeledEdge: WiremarkEdge = { ...edge, label: 'Algorithms' };

type SceneNode = {
  value?: string;
  rotation?: number;
  size?: number;
  position?: { x: number; y: number };
  dashes?: { offset: number };
  getPointAt?: (t: number) => { x: number; y: number };
  children?: SceneNode[];
};

function find(
  node: SceneNode,
  predicate: (n: SceneNode) => boolean
): SceneNode | null {
  if (predicate(node)) return node;
  for (const child of node.children ?? []) {
    const found = find(child, predicate);
    if (found) return found;
  }
  return null;
}

describe('WiremarkConnection dash animation', () => {
  it('advances the dash offset on frame updates without React state', () => {
    const captured: { two?: Two | null } = {};

    function Probe() {
      captured.two = useTwo().two;
      return null;
    }

    const { container } = render(
      <Canvas type={Two.Types.canvas} width={800} height={600} autostart={false}>
        <WiremarkConnection edge={edge} sourceNode={source} targetNode={target} />
        <Probe />
      </Canvas>
    );

    const two = captured.two!;
    expect(two).toBeTruthy();

    // WiremarkConnection wraps its Path in a Group, so walk the scene graph
    // for the first object carrying a dashes pattern.
    type Node = { dashes?: { offset: number }; children?: Node[] };
    function findDashed(node: Node): Node | null {
      if (node.dashes && typeof node.dashes.offset === 'number') return node;
      for (const child of node.children ?? []) {
        const found = findDashed(child);
        if (found) return found;
      }
      return null;
    }

    const path = findDashed(two.scene as unknown as Node);
    expect(path).not.toBeNull();
    expect(path!.dashes!.offset).toBe(0);

    act(() => {
      two.update();
      two.update();
    });

    // Marching ants run in the negative direction.
    expect(path!.dashes!.offset).toBeLessThan(0);

    const afterTwoFrames = path!.dashes!.offset;
    act(() => {
      two.update();
    });
    expect(path!.dashes!.offset).toBeLessThan(afterTwoFrames);

    // The offset advanced purely by mutation, so nothing re-rendered.
    expect(container).toBeTruthy();
  });
});

describe('WiremarkConnection label alignment', () => {
  it('places the label on the rendered curve, not a Bezier approximation', () => {
    const captured: { two?: Two | null } = {};

    function Probe() {
      captured.two = useTwo().two;
      return null;
    }

    render(
      <Canvas type={Two.Types.canvas} width={800} height={600} autostart={false}>
        <WiremarkConnection
          edge={labeledEdge}
          sourceNode={source}
          targetNode={target}
        />
        <Probe />
      </Canvas>
    );

    const two = captured.two!;
    act(() => {
      two.update();
      two.update();
    });

    const scene = two.scene as unknown as SceneNode;
    const path = find(scene, (n) => typeof n.getPointAt === 'function');
    const label = find(scene, (n) => n.value === 'Algorithms');

    expect(path).not.toBeNull();
    expect(label).not.toBeNull();

    // Ground truth comes from the path Two.js actually renders.
    const a = path!.getPointAt!(0.45);
    const b = path!.getPointAt!(0.55);
    const expectedAngle = Math.atan2(b.y - a.y, b.x - a.x);

    expect(label!.rotation).toBeCloseTo(expectedAngle, 3);

    const size = label!.size!;
    const ox = size * Math.cos(expectedAngle - Math.PI / 2);
    const oy = size * Math.sin(expectedAngle - Math.PI / 2);

    expect(label!.position!.x).toBeCloseTo(0.5 * (b.x - a.x) + a.x + ox, 3);
    expect(label!.position!.y).toBeCloseTo(0.5 * (b.y - a.y) + a.y + oy, 3);
  });
});
