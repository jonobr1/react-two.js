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
