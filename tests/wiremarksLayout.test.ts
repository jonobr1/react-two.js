import { describe, it, expect } from 'vitest';
import { layoutGraph } from '../src/playgrounds/wiremarks/layout';

const size = { width: 300, height: 200 };

function edge(sourceId: string, targetId: string) {
  return { sourceId, targetId };
}

/** Distinct x values, ascending. */
function columns(positions: Map<string, { x: number; y: number }>) {
  return [...new Set([...positions.values()].map((p) => p.x))].sort(
    (a, b) => a - b
  );
}

describe('layoutGraph', () => {
  it('places a chain in consecutive columns', () => {
    const positions = layoutGraph(
      ['A', 'B', 'C'],
      [edge('A', 'B'), edge('B', 'C')],
      size
    );

    expect(positions.get('A')!.x).toBeLessThan(positions.get('B')!.x);
    expect(positions.get('B')!.x).toBeLessThan(positions.get('C')!.x);
    expect(columns(positions)).toHaveLength(3);
  });

  it('puts a chain on a single shared row', () => {
    const positions = layoutGraph(
      ['A', 'B', 'C'],
      [edge('A', 'B'), edge('B', 'C')],
      size
    );

    expect(positions.get('A')!.y).toBe(positions.get('B')!.y);
    expect(positions.get('B')!.y).toBe(positions.get('C')!.y);
  });

  it('stacks siblings in the same column', () => {
    // The default graph shape: Processing feeds both p5.js and Two.js.
    const positions = layoutGraph(
      ['Processing', 'p5.js', 'Two.js'],
      [edge('Processing', 'p5.js'), edge('Processing', 'Two.js')],
      size
    );

    const p5 = positions.get('p5.js')!;
    const two = positions.get('Two.js')!;

    expect(p5.x).toBe(two.x);
    expect(p5.y).not.toBe(two.y);
    expect(positions.get('Processing')!.x).toBeLessThan(p5.x);
  });

  it('centers a column of siblings around the row axis', () => {
    const positions = layoutGraph(
      ['Root', 'A', 'B'],
      [edge('Root', 'A'), edge('Root', 'B')],
      size
    );

    const root = positions.get('Root')!;
    const mean = (positions.get('A')!.y + positions.get('B')!.y) / 2;

    expect(mean).toBeCloseTo(root.y, 6);
  });

  it('ranks a node after its deepest predecessor', () => {
    // Diamond: A->B->D and A->C->D. D must sit past both B and C.
    const positions = layoutGraph(
      ['A', 'B', 'C', 'D'],
      [edge('A', 'B'), edge('A', 'C'), edge('B', 'D'), edge('C', 'D')],
      size
    );

    const d = positions.get('D')!.x;
    expect(d).toBeGreaterThan(positions.get('B')!.x);
    expect(d).toBeGreaterThan(positions.get('C')!.x);
    expect(columns(positions)).toHaveLength(3);
  });

  it('uses the longest path, not the shortest, to rank', () => {
    // A->C directly, and A->B->C. C belongs in column 2, not column 1.
    const positions = layoutGraph(
      ['A', 'B', 'C'],
      [edge('A', 'C'), edge('A', 'B'), edge('B', 'C')],
      size
    );

    expect(positions.get('C')!.x).toBeGreaterThan(positions.get('B')!.x);
  });

  it('terminates on mutual influence without hanging', () => {
    const positions = layoutGraph(
      ['A', 'B'],
      [edge('A', 'B'), edge('B', 'A')],
      size
    );

    expect(positions.size).toBe(2);
    expect(positions.get('A')!.x).toBeLessThan(positions.get('B')!.x);
  });

  it('terminates on a longer cycle', () => {
    const positions = layoutGraph(
      ['A', 'B', 'C'],
      [edge('A', 'B'), edge('B', 'C'), edge('C', 'A')],
      size
    );

    expect(positions.size).toBe(3);
    expect(columns(positions)).toHaveLength(3);
  });

  it('ignores self loops', () => {
    const positions = layoutGraph(['A', 'B'], [edge('A', 'A'), edge('A', 'B')], size);

    expect(positions.size).toBe(2);
    expect(positions.get('A')!.x).toBeLessThan(positions.get('B')!.x);
  });

  it('ignores edges naming unknown nodes', () => {
    const positions = layoutGraph(
      ['A', 'B'],
      [edge('A', 'B'), edge('B', 'Ghost'), edge('Ghost', 'A')],
      size
    );

    expect(positions.size).toBe(2);
    expect(positions.has('Ghost')).toBe(false);
  });

  it('places disconnected nodes in the first column', () => {
    const positions = layoutGraph(['Lonely', 'A', 'B'], [edge('A', 'B')], size);

    expect(positions.get('Lonely')!.x).toBe(positions.get('A')!.x);
    expect(positions.get('Lonely')!.y).not.toBe(positions.get('A')!.y);
  });

  it('is deterministic across repeated calls', () => {
    const ids = ['A', 'B', 'C', 'D', 'E'];
    const edges = [
      edge('A', 'B'),
      edge('A', 'C'),
      edge('B', 'D'),
      edge('C', 'D'),
      edge('D', 'E'),
    ];

    const first = layoutGraph(ids, edges, size);
    const second = layoutGraph(ids, edges, size);

    expect([...second.entries()]).toEqual([...first.entries()]);
  });

  it('returns an empty map for an empty graph', () => {
    expect(layoutGraph([], [], size).size).toBe(0);
  });

  it('honors custom spacing', () => {
    const positions = layoutGraph(['A', 'B'], [edge('A', 'B')], size, {
      columnSpacing: 1000,
    });

    const dx = positions.get('B')!.x - positions.get('A')!.x;
    expect(dx).toBe(1000);
  });

  it('separates columns by more than a node width', () => {
    const positions = layoutGraph(['A', 'B'], [edge('A', 'B')], size);

    const dx = positions.get('B')!.x - positions.get('A')!.x;
    expect(dx).toBeGreaterThan(size.width);
  });

  it('separates stacked rows by more than a node height', () => {
    const positions = layoutGraph(
      ['Root', 'A', 'B'],
      [edge('Root', 'A'), edge('Root', 'B')],
      size
    );

    const dy = Math.abs(positions.get('A')!.y - positions.get('B')!.y);
    expect(dy).toBeGreaterThan(size.height);
  });

  it('keeps every node inside the positive quadrant', () => {
    // Two.js draws from a top-left origin, so negative coordinates are
    // off-canvas before the user has panned anywhere.
    const positions = layoutGraph(
      ['Root', 'A', 'B'],
      [edge('Root', 'A'), edge('Root', 'B')],
      size
    );

    for (const point of positions.values()) {
      expect(point.x - size.width / 2).toBeGreaterThanOrEqual(0);
      expect(point.y - size.height / 2).toBeGreaterThanOrEqual(0);
    }
  });

  it('leaves a margin between the origin and the closest node edge', () => {
    const positions = layoutGraph(
      ['Root', 'A', 'B'],
      [edge('Root', 'A'), edge('Root', 'B')],
      size,
      { margin: 40 }
    );

    const left = Math.min(
      ...[...positions.values()].map((p) => p.x - size.width / 2)
    );
    const top = Math.min(
      ...[...positions.values()].map((p) => p.y - size.height / 2)
    );

    expect(left).toBe(40);
    expect(top).toBe(40);
  });

  it('reduces crossings by reordering within a rank', () => {
    // A -> Y and B -> X. Seeded order is X,Y so the edges cross; a
    // barycenter sweep should swap them.
    const positions = layoutGraph(
      ['A', 'B', 'X', 'Y'],
      [edge('A', 'Y'), edge('B', 'X')],
      size
    );

    const aAboveB = positions.get('A')!.y < positions.get('B')!.y;
    const yAboveX = positions.get('Y')!.y < positions.get('X')!.y;

    // Whichever way round the first column lands, the second column should
    // mirror it so the two edges run parallel instead of crossing.
    expect(yAboveX).toBe(aAboveB);
  });
});
