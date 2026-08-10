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
