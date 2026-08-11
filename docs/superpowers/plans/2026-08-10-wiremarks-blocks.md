# Wiremarks Block-Scoped Entities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make entity names canonical only within a block, where a line of three or more hyphens (`---`) starts a new block — so the same name written in two blocks becomes two separate entities on the canvas.

**Architecture:** The parser splits source into blocks on separator lines and scopes each entity id with a per-name occurrence ordinal, keeping the raw name on `node.name` for display. Each block is laid out independently by the existing `layoutGraph`, then stacked vertically by a new `layoutBlocks`.

**Tech Stack:** TypeScript (strict), React 18.3+, Two.js, Vitest + jsdom.

## Global Constraints

- **Only `---` separates blocks.** A blank line is cosmetic and splits nothing. Comment lines are ignored exactly as they are today and never split a block.
- A separator line is a trimmed line matching `/^-{3,}$/` — three or more hyphens and nothing else. Verified not to collide with connection syntax: `--`, `-----> B`, `A -> B` and `- - -` all fail to match, while `---`, `----` and `---  ` match.
- `node.id` becomes block-scoped; `node.name` stays the raw typed name. **`WiremarkEntity` already renders `node.name` and uses `node.id` only as a drag key, so no rendering code changes.**
- Ids use `\u0000` as the scope separator because it cannot be typed into an entity name. Ids are internal only — never displayed.
- Blocks with no entities produce nothing (no empty blocks in output).
- Run tests with `npx vitest run <path>` (bare `npm test` starts watch mode).
- Existing behavior for a single-block document must be **byte-identical** to today's output positions. Task 2 asserts this.

## Verified Preconditions

| Assumption | Status |
|---|---|
| `/^-{3,}$/` matches `---`/`----`/`---  `, rejects `--`/`-----> B`/`A -> B`/`- - -` | ✅ verified |
| `WiremarkEntity` renders `node.name`, not `node.id` | ✅ verified (`WiremarkEntity.tsx:90`) |
| `POSITIONS_VERSION` mechanism already discards mismatched payloads | ✅ verified (`tests/wiremarksStorage.test.ts`) |

---

## File Structure

**Modify:**
- `src/playgrounds/wiremarks/types.ts` — add `ParsedBlock`, extend `GraphData`
- `src/playgrounds/wiremarks/parser.ts` — block splitting + scoped ids
- `src/playgrounds/wiremarks/layout.ts` — add `layoutBlocks`
- `src/playgrounds/wiremarks/hooks/useWiremarksGraph.ts` — use `layoutBlocks`
- `src/playgrounds/wiremarks/storage.ts` — bump `POSITIONS_VERSION` to 2
- `src/playgrounds/wiremarks/WiremarksPlayground.tsx` — default prompt teaches `---`
- `tests/wiremarks.test.ts`, `tests/wiremarksGraph.test.ts` — updated for scoped ids

**Out of scope:** visual chrome around blocks, block titles in the DSL, cross-block connections (impossible by construction), and re-ordering blocks by drag.

---

### Task 1: Parser splits blocks and scopes entity ids

**Files:**
- Modify: `src/playgrounds/wiremarks/types.ts`, `src/playgrounds/wiremarks/parser.ts`
- Test: `tests/wiremarks.test.ts`

**Interfaces:**
- Produces: `ParsedBlock { nodeIds: string[]; edges: WiremarkEdge[] }`; `GraphData` gains `blocks: ParsedBlock[]`. Node ids become `` `${name}\u0000${occurrence}` `` where `occurrence` counts, in document order, how many blocks so far have mentioned that name.

- [ ] **Step 1: Write the failing tests**

Replace the whole of `tests/wiremarks.test.ts` with:

```ts
import { describe, it, expect } from 'vitest';
import { parseWiremarksDSL } from '../src/playgrounds/wiremarks/parser';
import type { GraphData } from '../src/playgrounds/wiremarks/types';

/** Ids are scoped internals; assert against display names instead. */
function nameOf(graph: GraphData, id: string): string {
  return graph.nodes.find((node) => node.id === id)!.name;
}

describe('Wiremarks DSL Parser', () => {
  it('should parse simple entity connections', () => {
    const graph = parseWiremarksDSL(`
      Grandmother -> Mother
      Mother -> Daughter
    `);

    expect(graph.nodes).toHaveLength(3);
    expect(graph.nodes.map((n) => n.name)).toEqual([
      'Grandmother',
      'Mother',
      'Daughter',
    ]);

    expect(graph.edges).toHaveLength(2);
    expect(nameOf(graph, graph.edges[0].sourceId)).toBe('Grandmother');
    expect(nameOf(graph, graph.edges[0].targetId)).toBe('Mother');
    expect(nameOf(graph, graph.edges[1].sourceId)).toBe('Mother');
    expect(nameOf(graph, graph.edges[1].targetId)).toBe('Daughter');
  });

  it('should parse labeled connections with bracket syntax', () => {
    const graph = parseWiremarksDSL(`Grid -[Electricity]-> Home`);

    expect(graph.nodes.map((n) => n.name)).toEqual(['Grid', 'Home']);
    expect(graph.edges).toHaveLength(1);
    expect(graph.edges[0].label).toBe('Electricity');
  });

  it('should ignore comment lines starting with #', () => {
    const graph = parseWiremarksDSL(`
      # This is a comment
      EntityA -> EntityB
      # Another comment line
    `);

    expect(graph.nodes).toHaveLength(2);
    expect(graph.edges).toHaveLength(1);
  });

  it('should parse hyphenated entity names correctly', () => {
    const graph = parseWiremarksDSL(`react-two.js -[wraps]-> two.js`);

    expect(graph.nodes.map((n) => n.name)).toEqual(['react-two.js', 'two.js']);
  });

  it('should handle empty or invalid inputs gracefully', () => {
    expect(parseWiremarksDSL('')).toEqual({ nodes: [], edges: [], blocks: [] });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(parseWiremarksDSL(null as any)).toEqual({
      nodes: [],
      edges: [],
      blocks: [],
    });
  });

  describe('blocks', () => {
    it('treats a blank line as cosmetic, not a separator', () => {
      const graph = parseWiremarksDSL('A -> B\n\nB -> C');

      expect(graph.blocks).toHaveLength(1);
      expect(graph.nodes).toHaveLength(3);
    });

    it('starts a new block on a line of three hyphens', () => {
      const graph = parseWiremarksDSL('A -> B\n---\nA -> C');

      expect(graph.blocks).toHaveLength(2);
    });

    it('creates a separate entity per block for a repeated name', () => {
      const graph = parseWiremarksDSL('A -> B\nB -> C\n---\nA -> D');

      const aNodes = graph.nodes.filter((n) => n.name === 'A');
      expect(aNodes).toHaveLength(2);
      expect(aNodes[0].id).not.toBe(aNodes[1].id);
    });

    it('keeps one entity for a name repeated inside a single block', () => {
      const graph = parseWiremarksDSL('A -> B\nB -> C');

      expect(graph.nodes.filter((n) => n.name === 'B')).toHaveLength(1);
    });

    it('numbers occurrences of a name in document order', () => {
      const graph = parseWiremarksDSL('A -> B\n---\nA -> C\n---\nA -> D');

      expect(graph.nodes.filter((n) => n.name === 'A')).toHaveLength(3);
      expect(new Set(graph.nodes.map((n) => n.id)).size).toBe(
        graph.nodes.length
      );
    });

    it('gives each block only its own nodes and edges', () => {
      const graph = parseWiremarksDSL('A -> B\n---\nA -> C');

      expect(graph.blocks[0].nodeIds).toHaveLength(2);
      expect(graph.blocks[0].edges).toHaveLength(1);
      expect(graph.blocks[1].nodeIds).toHaveLength(2);
      expect(graph.blocks[1].edges).toHaveLength(1);
      expect(graph.blocks[0].nodeIds).not.toContain(graph.blocks[1].nodeIds[0]);
    });

    it('accepts four or more hyphens and trailing whitespace', () => {
      expect(parseWiremarksDSL('A -> B\n-----\nA -> C').blocks).toHaveLength(2);
      expect(parseWiremarksDSL('A -> B\n---   \nA -> C').blocks).toHaveLength(2);
    });

    it('does not treat two hyphens as a separator', () => {
      expect(parseWiremarksDSL('A -> B\n--\nA -> C').blocks).toHaveLength(1);
    });

    it('does not treat a commented separator as a separator', () => {
      expect(parseWiremarksDSL('A -> B\n# ---\nA -> C').blocks).toHaveLength(1);
    });

    it('produces no empty blocks for leading or repeated separators', () => {
      const graph = parseWiremarksDSL('---\n---\nA -> B\n---\n---');

      expect(graph.blocks).toHaveLength(1);
    });

    it('gives every edge a unique id across blocks', () => {
      const graph = parseWiremarksDSL('A -> B\n---\nA -> B');

      expect(graph.edges).toHaveLength(2);
      expect(graph.edges[0].id).not.toBe(graph.edges[1].id);
    });

    it('gives repeated names the same color', () => {
      const graph = parseWiremarksDSL('A -> B\n---\nA -> C');
      const [first, second] = graph.nodes.filter((n) => n.name === 'A');

      expect(first.colors).toEqual(second.colors);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/wiremarks.test.ts`
Expected: FAIL — `graph.blocks` is undefined, and the empty-input tests fail because `blocks: []` is missing.

- [ ] **Step 3: Add the block type**

In `src/playgrounds/wiremarks/types.ts`, replace the `GraphData` interface with:

```ts
/** One `---`-delimited section. Names are canonical only within a block. */
export interface ParsedBlock {
  nodeIds: string[];
  edges: WiremarkEdge[];
}

export interface GraphData {
  nodes: ParsedNode[];
  edges: WiremarkEdge[];
  blocks: ParsedBlock[];
}
```

- [ ] **Step 4: Rewrite the parser**

Replace everything from `const emptyMatch` to the end of `src/playgrounds/wiremarks/parser.ts` with:

```ts
const emptyMatch = ['', ''];

/** A line of three or more hyphens, and nothing else, starts a new block. */
const BLOCK_SEPARATOR = /^-{3,}$/;

/**
 * Entity names are canonical only within a block, so the same name in two
 * blocks is two entities. Ids carry an occurrence ordinal behind a NUL,
 * which cannot be typed into a name. Ids are internal — `name` is displayed.
 */
const ID_SEPARATOR = '\u0000';

interface RawConnection {
  producer: string;
  consumer: string;
  label?: string;
}

export function parseWiremarksDSL(instructions: string): GraphData {
  if (typeof instructions !== 'string') {
    return { nodes: [], edges: [], blocks: [] };
  }

  // Split into blocks. Blank lines are cosmetic; comments are ignored.
  const blockLines: string[][] = [[]];
  for (const rawLine of instructions.split(/\n/)) {
    const line = rawLine.trim();

    if (BLOCK_SEPARATOR.test(line)) {
      blockLines.push([]);
      continue;
    }
    if (line.length === 0 || line.startsWith('#')) {
      continue;
    }
    blockLines[blockLines.length - 1].push(line);
  }

  const nodes: ParsedNode[] = [];
  const edges: WiremarkEdge[] = [];
  const blocks: ParsedBlock[] = [];

  // How many blocks so far have mentioned each name.
  const occurrences = new Map<string, number>();

  for (const lines of blockLines) {
    const namesInBlock: string[] = [];
    const connections: RawConnection[] = [];

    for (const line of lines) {
      const producerMatch = line.match(/^(.*?)(?:->|-\[)/) || emptyMatch;
      const currencyMatch = line.match(/\[([^\]]+)\]/) || emptyMatch;
      const consumerMatch = line.match(/->(.+)$/) || emptyMatch;

      const producer = producerMatch[1].trim();
      const currency = currencyMatch[1].trim();
      const consumer = consumerMatch[1].trim();

      if (producer.length > 0 && !namesInBlock.includes(producer)) {
        namesInBlock.push(producer);
      }
      if (consumer.length > 0 && !namesInBlock.includes(consumer)) {
        namesInBlock.push(consumer);
      }

      if (producer.length > 0 && consumer.length > 0) {
        connections.push({
          producer,
          consumer,
          label: currency.length > 0 ? currency : undefined,
        });
      }
    }

    if (namesInBlock.length === 0) {
      continue;
    }

    const idsByName = new Map<string, string>();
    for (const name of namesInBlock) {
      const occurrence = (occurrences.get(name) ?? 0) + 1;
      occurrences.set(name, occurrence);

      const id = `${name}${ID_SEPARATOR}${occurrence}`;
      idsByName.set(name, id);

      nodes.push({
        id,
        name,
        width: nodeWidth,
        height: nodeHeight,
        colors: generateNodeColors(name),
      });
    }

    const blockEdges: WiremarkEdge[] = connections.map((conn, index) => {
      const label = conn.label || 'connection';
      const sourceId = idsByName.get(conn.producer)!;
      const targetId = idsByName.get(conn.consumer)!;

      return {
        id: `${sourceId}->${targetId}-${edges.length + index}`,
        sourceId,
        targetId,
        label: conn.label,
        color: stringToColor(label),
      };
    });

    edges.push(...blockEdges);
    blocks.push({
      nodeIds: namesInBlock.map((name) => idsByName.get(name)!),
      edges: blockEdges,
    });
  }

  return { nodes, edges, blocks };
}
```

Update the import on line 1 to include `ParsedBlock`:

```ts
import {
  GraphData,
  ParsedBlock,
  ParsedNode,
  WiremarkEdge,
  NodeColors,
} from './types';
```

- [ ] **Step 5: Run tests to verify they pass**

Run: `npx vitest run tests/wiremarks.test.ts`
Expected: PASS, 17 tests.

- [ ] **Step 6: Commit**

```bash
npm run lint
git add src/playgrounds/wiremarks/types.ts src/playgrounds/wiremarks/parser.ts tests/wiremarks.test.ts
git commit -m "feat(wiremarks): scope entities to --- delimited blocks"
```

---

### Task 2: Stack blocks vertically

**Files:**
- Modify: `src/playgrounds/wiremarks/layout.ts`
- Test: `tests/wiremarksLayout.test.ts`

**Interfaces:**
- Consumes: `layoutGraph(nodeIds, edges, nodeSize, options)` and `LayoutEdge`, both already exported from `layout.ts`.
- Produces: `layoutBlocks(blocks: LayoutBlockInput[], nodeSize, options?): Map<string, Vector2D>` and `LayoutBlockInput { nodeIds: string[]; edges: LayoutEdge[] }`.

- [ ] **Step 1: Write the failing tests**

Append to `tests/wiremarksLayout.test.ts`:

```ts
describe('layoutBlocks', () => {
  it('matches layoutGraph exactly for a single block', () => {
    const nodeIds = ['A', 'B', 'C'];
    const edges = [edge('A', 'B'), edge('B', 'C')];

    const single = layoutGraph(nodeIds, edges, size);
    const stacked = layoutBlocks([{ nodeIds, edges }], size);

    expect([...stacked.entries()]).toEqual([...single.entries()]);
  });

  it('places a later block entirely below an earlier one', () => {
    const positions = layoutBlocks(
      [
        { nodeIds: ['A', 'B'], edges: [edge('A', 'B')] },
        { nodeIds: ['C', 'D'], edges: [edge('C', 'D')] },
      ],
      size
    );

    const firstBottom = Math.max(positions.get('A')!.y, positions.get('B')!.y);
    const secondTop = Math.min(positions.get('C')!.y, positions.get('D')!.y);

    expect(secondTop).toBeGreaterThan(firstBottom);
  });

  it('leaves a gap between block bounding boxes', () => {
    const positions = layoutBlocks(
      [
        { nodeIds: ['A'], edges: [] },
        { nodeIds: ['B'], edges: [] },
      ],
      size,
      { blockGap: 500 }
    );

    const gap =
      positions.get('B')!.y -
      size.height / 2 -
      (positions.get('A')!.y + size.height / 2);

    expect(gap).toBe(500);
  });

  it('keeps every block starting from the same left edge', () => {
    const positions = layoutBlocks(
      [
        { nodeIds: ['A', 'B'], edges: [edge('A', 'B')] },
        { nodeIds: ['C', 'D'], edges: [edge('C', 'D')] },
      ],
      size
    );

    expect(positions.get('C')!.x).toBe(positions.get('A')!.x);
  });

  it('accounts for a tall block when placing the next one', () => {
    // First block stacks three siblings; the second must clear all of them.
    const positions = layoutBlocks(
      [
        {
          nodeIds: ['R', 'A', 'B', 'C'],
          edges: [edge('R', 'A'), edge('R', 'B'), edge('R', 'C')],
        },
        { nodeIds: ['Z'], edges: [] },
      ],
      size
    );

    const tallest = Math.max(
      positions.get('A')!.y,
      positions.get('B')!.y,
      positions.get('C')!.y
    );

    expect(positions.get('Z')!.y).toBeGreaterThan(tallest);
  });

  it('skips empty blocks', () => {
    const positions = layoutBlocks(
      [
        { nodeIds: [], edges: [] },
        { nodeIds: ['A'], edges: [] },
      ],
      size
    );

    expect(positions.size).toBe(1);
    expect(positions.get('A')!.y).toBe(
      layoutBlocks([{ nodeIds: ['A'], edges: [] }], size).get('A')!.y
    );
  });

  it('returns an empty map for no blocks', () => {
    expect(layoutBlocks([], size).size).toBe(0);
  });
});
```

Update the import at the top of the file:

```ts
import { layoutGraph, layoutBlocks } from '../src/playgrounds/wiremarks/layout';
```

- [ ] **Step 2: Run tests to verify they fail**

Run: `npx vitest run tests/wiremarksLayout.test.ts`
Expected: FAIL — `layoutBlocks is not a function`.

- [ ] **Step 3: Implement `layoutBlocks`**

Append to `src/playgrounds/wiremarks/layout.ts`:

```ts
export interface LayoutBlockInput {
  nodeIds: string[];
  edges: LayoutEdge[];
}

export interface LayoutBlocksOptions extends LayoutOptions {
  /** Vertical gap between the bounding boxes of adjacent blocks. */
  blockGap?: number;
}

/**
 * Lay out each block independently, then stack them top to bottom.
 *
 * Blocks share no entities by construction, so there is nothing to gain from
 * ranking them together — and doing so would drop every block's roots into
 * column 0, interleaving separate diagrams.
 *
 * The first block is left exactly where a single-block layout would put it.
 */
export function layoutBlocks(
  blocks: LayoutBlockInput[],
  nodeSize: { width: number; height: number },
  options: LayoutBlocksOptions = {}
): Map<string, Vector2D> {
  const blockGap = options.blockGap ?? unit * 1.5;
  const combined = new Map<string, Vector2D>();
  let offsetY = 0;

  for (const block of blocks) {
    const positions = layoutGraph(
      block.nodeIds,
      block.edges,
      nodeSize,
      options
    );
    if (positions.size === 0) {
      continue;
    }

    let minY = Infinity;
    let maxY = -Infinity;
    for (const point of positions.values()) {
      minY = Math.min(minY, point.y);
      maxY = Math.max(maxY, point.y);
    }

    for (const [id, point] of positions) {
      combined.set(id, { x: point.x, y: point.y + offsetY });
    }

    offsetY += maxY - minY + nodeSize.height + blockGap;
  }

  return combined;
}
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npx vitest run tests/wiremarksLayout.test.ts`
Expected: PASS, 26 tests.

- [ ] **Step 5: Commit**

```bash
npm run lint
git add src/playgrounds/wiremarks/layout.ts tests/wiremarksLayout.test.ts
git commit -m "feat(wiremarks): stack independently laid out blocks"
```

---

### Task 3: Wire blocks into the graph hook

**Files:**
- Modify: `src/playgrounds/wiremarks/hooks/useWiremarksGraph.ts`, `src/playgrounds/wiremarks/storage.ts`
- Test: `tests/wiremarksGraph.test.ts`

**Interfaces:**
- Consumes: `GraphData.blocks` (Task 1); `layoutBlocks` (Task 2).
- Produces: no signature change — `useWiremarksGraph(instructions, resetToken)` still returns `{ nodes, edges, nodesMap, updateNodePosition, commitPositions }`. `nodesMap` is now keyed by scoped id.

Bumping `POSITIONS_VERSION` matters: every stored key was a bare name, and every id is now scoped, so old payloads would silently never match. Discarding them outright is the honest outcome.

- [ ] **Step 1: Rewrite the hook tests for scoped ids**

`nodesMap` is now keyed by scoped id, so every lookup goes through a
by-display-name helper. Replace the whole of `tests/wiremarksGraph.test.ts`
with:

```ts
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWiremarksGraph } from '../src/playgrounds/wiremarks/hooks/useWiremarksGraph';
import {
  POSITIONS_KEY,
  POSITIONS_VERSION,
  loadPositions,
} from '../src/playgrounds/wiremarks/storage';

const CHAIN = 'A -> B\nB -> C';

type HookResult = { current: ReturnType<typeof useWiremarksGraph> };

/** Ids are scoped internals; find nodes by the name the user typed. */
function node(result: HookResult, name: string) {
  return result.current.nodes.find((n) => n.name === name)!;
}

function seedStorage(positions: Record<string, { x: number; y: number }>) {
  window.localStorage.setItem(
    POSITIONS_KEY,
    JSON.stringify({ version: POSITIONS_VERSION, positions })
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('useWiremarksGraph', () => {
  it('positions nodes with the layered layout', () => {
    const { result } = renderHook(() => useWiremarksGraph(CHAIN));

    expect(node(result, 'A').x).toBeLessThan(node(result, 'B').x);
    expect(node(result, 'B').x).toBeLessThan(node(result, 'C').x);
  });

  it('restores persisted positions on mount', () => {
    const probe = renderHook(() => useWiremarksGraph(CHAIN));
    const id = node(probe.result, 'B').id;
    probe.unmount();

    seedStorage({ [id]: { x: 1234, y: 5678 } });

    const { result } = renderHook(() => useWiremarksGraph(CHAIN));
    expect(node(result, 'B')).toMatchObject({ x: 1234, y: 5678 });
  });

  it('leaves nodes without a stored position to the layout', () => {
    const probe = renderHook(() => useWiremarksGraph(CHAIN));
    const id = node(probe.result, 'B').id;
    probe.unmount();

    seedStorage({ [id]: { x: 1234, y: 5678 } });

    const { result } = renderHook(() => useWiremarksGraph(CHAIN));
    expect(node(result, 'A').x).not.toBe(1234);
  });

  it('persists only dragged nodes when positions are committed', () => {
    const { result } = renderHook(() => useWiremarksGraph(CHAIN));
    const id = node(result, 'B').id;

    act(() => {
      result.current.updateNodePosition(id, 42, 84);
    });
    act(() => {
      result.current.commitPositions();
    });

    expect(loadPositions()).toEqual({ [id]: { x: 42, y: 84 } });
  });

  it('does not write to storage while a drag is in progress', () => {
    const { result } = renderHook(() => useWiremarksGraph(CHAIN));

    act(() => {
      result.current.updateNodePosition(node(result, 'B').id, 42, 84);
    });

    expect(loadPositions()).toEqual({});
  });

  it('pins dragged nodes when the text changes', () => {
    const { result, rerender } = renderHook(
      ({ text }) => useWiremarksGraph(text),
      { initialProps: { text: CHAIN } }
    );

    act(() => {
      result.current.updateNodePosition(node(result, 'C').id, 999, 111);
    });

    rerender({ text: `Zero -> A\n${CHAIN}` });

    expect(node(result, 'C')).toMatchObject({ x: 999, y: 111 });
  });

  it('reflows undragged nodes when the text changes', () => {
    const { result, rerender } = renderHook(
      ({ text }) => useWiremarksGraph(text),
      { initialProps: { text: CHAIN } }
    );

    const before = node(result, 'A').x;
    rerender({ text: `Zero -> A\n${CHAIN}` });

    expect(node(result, 'A').x).toBeGreaterThan(before);
  });

  it('drops stored positions for entities removed from the text', () => {
    const { result, rerender } = renderHook(
      ({ text }) => useWiremarksGraph(text),
      { initialProps: { text: CHAIN } }
    );

    const id = node(result, 'C').id;
    act(() => {
      result.current.updateNodePosition(id, 5, 5);
    });
    act(() => {
      result.current.commitPositions();
    });
    expect(loadPositions()).toHaveProperty(id);

    rerender({ text: 'A -> B' });
    act(() => {
      result.current.commitPositions();
    });

    expect(loadPositions()).not.toHaveProperty(id);
  });

  it('clears overrides and storage when the reset token changes', () => {
    const { result, rerender } = renderHook(
      ({ token }) => useWiremarksGraph(CHAIN, token),
      { initialProps: { token: 0 } }
    );

    const id = node(result, 'B').id;
    act(() => {
      result.current.updateNodePosition(id, 42, 84);
    });
    act(() => {
      result.current.commitPositions();
    });
    expect(loadPositions()).toEqual({ [id]: { x: 42, y: 84 } });

    rerender({ token: 1 });

    expect(loadPositions()).toEqual({});
    expect(node(result, 'B').x).not.toBe(42);
  });

  describe('blocks', () => {
    it('places every node of a later block below every node of an earlier one', () => {
      const { result } = renderHook(() =>
        useWiremarksGraph('A -> B\nB -> C\n---\nD -> E')
      );

      const first = ['A', 'B', 'C'].map((name) => node(result, name).y);
      const second = ['D', 'E'].map((name) => node(result, name).y);

      expect(Math.min(...second)).toBeGreaterThan(Math.max(...first));
    });

    it('gives repeated names across blocks distinct ids', () => {
      const { result } = renderHook(() =>
        useWiremarksGraph('A -> B\n---\nA -> C')
      );

      const [first, second] = result.current.nodes.filter(
        (n) => n.name === 'A'
      );
      expect(first.id).not.toBe(second.id);
    });

    it('drags one occurrence of a name without moving the other', () => {
      const { result } = renderHook(() =>
        useWiremarksGraph('A -> B\n---\nA -> C')
      );

      const [first, second] = result.current.nodes.filter(
        (n) => n.name === 'A'
      );
      const secondY = second.y;

      act(() => {
        result.current.updateNodePosition(first.id, 10, 20);
      });

      const after = result.current.nodes.filter((n) => n.name === 'A');
      expect(after[0]).toMatchObject({ x: 10, y: 20 });
      expect(after[1].y).toBe(secondY);
    });
  });
});
```

- [ ] **Step 2: Run tests to verify the block test fails**

Run: `npx vitest run tests/wiremarksGraph.test.ts`
Expected: FAIL on exactly one test — `places every node of a later block below every node of an earlier one`.

This is the only assertion that requires `layoutBlocks`. After Task 1 the parser already produces distinct ids, so a flat `layoutGraph` puts both blocks' roots in column 0 and interleaves them vertically; `D` lands beside `A` rather than below `C`. The other two block tests pass on Task 1 alone — they guard the id scheme, not the stacking.

- [ ] **Step 3: Switch the hook to `layoutBlocks`**

In `src/playgrounds/wiremarks/hooks/useWiremarksGraph.ts`, change the import:

```ts
import { layoutBlocks } from '../layout';
```

and replace the `layout` memo with:

```ts
  // Each block lays out on its own, then stacks below the previous one.
  const layout = useMemo(() => {
    return layoutBlocks(baseGraph.blocks, NODE_SIZE);
  }, [baseGraph]);
```

- [ ] **Step 4: Bump the storage version**

In `src/playgrounds/wiremarks/storage.ts`, change:

```ts
export const POSITIONS_VERSION = 2;
```

- [ ] **Step 5: Run the full suite**

```bash
npx vitest run
npm run lint
npx tsc --noEmit -p ./tsconfig.app.json
npx tsc --noEmit -p ./tsconfig.build.json
```
Expected: all PASS, no type errors.

- [ ] **Step 6: Commit**

```bash
git add src/playgrounds/wiremarks/hooks/useWiremarksGraph.ts src/playgrounds/wiremarks/storage.ts tests/wiremarksGraph.test.ts
git commit -m "feat(wiremarks): lay out blocks and rescope stored positions"
```

---

### Task 4: Teach `---` in the default prompt and docs

**Files:**
- Modify: `src/playgrounds/wiremarks/WiremarksPlayground.tsx:14-31`, `CLAUDE.md`

A syntax nobody is told about is invisible. The current default prompt is a single block and keeps working unchanged, so this task only *adds* a demonstration.

- [ ] **Step 1: Extend the default prompt**

In `src/playgrounds/wiremarks/WiremarksPlayground.tsx`, replace the `defaultPrompt` constant with:

```tsx
const defaultPrompt = `
# Wiremarks is a simple interface to compose
# wireframes and organizational structures
# through text. Connect things with an arrow
# like so:
react -> react-two.js

# Each line of text is a connection.
react-dom -> react-two.js

# And you can label connections by using
# brackets like so:
react-two.js -[wraps]-> two.js

# Lastly, starting a line with a hashtag
# makes your text a comment and will not
# be compiled into any connections.

# Blank lines are just for readability. To
# start a separate diagram, use three dashes.
# Names are only shared within one diagram,
# so the "react" below is its own entity:
---
react -> preact
`.trim();
```

- [ ] **Step 2: Verify by hand**

Run `npm run dev`, open the Wiremarks playground, close the instructions, then confirm:
1. The first four connections still form **one** connected diagram.
2. A second, separate `react -> preact` diagram sits **below** it.
3. There are two boxes labelled `react`, in the same color.
4. Dragging one `react` does not move the other.
5. Reloading the page restores both dragged positions.
6. Reset restores the default text, clears dragged positions, and resets zoom.

- [ ] **Step 3: Document the rule**

In `CLAUDE.md`, add under the Wiremarks material:

```markdown
### Wiremarks Blocks
`---` (three or more hyphens on their own line) starts a new block. Entity
names are canonical only *within* a block, so the same name written in two
blocks renders as two independent entities. Blank lines are cosmetic and
never split a block; comments never split one either.

Node ids are scoped as `` `${name}\u0000${occurrence}` `` where occurrence
counts blocks mentioning that name, in document order. `node.name` stays the
raw name and is what gets rendered — ids are internal only. Changing this
scheme requires bumping `POSITIONS_VERSION` in `storage.ts`, since stored
drag positions are keyed by id.
```

- [ ] **Step 4: Commit**

```bash
npm run lint
git add src/playgrounds/wiremarks/WiremarksPlayground.tsx CLAUDE.md
git commit -m "docs(wiremarks): demonstrate the --- block separator"
```

---

## Verification Checklist

```bash
npx vitest run
npm run lint
npx tsc --noEmit -p ./tsconfig.app.json
npx tsc --noEmit -p ./tsconfig.build.json
npm run build:lib
```

Then confirm by hand that a single-block document is laid out exactly as it was before this change — Task 2's first test asserts this at the unit level, but it is the property most likely to regress in real use.
