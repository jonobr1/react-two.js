import { describe, it, expect } from 'vitest';
import { parseWiremarksDSL } from '../src/playgrounds/wiremarks/parser';

describe('Wiremarks DSL Parser', () => {
  it('should parse simple entity connections', () => {
    const script = `
      Grandmother -> Mother
      Mother -> Daughter
    `;

    const { nodes, edges } = parseWiremarksDSL(script);

    expect(nodes).toHaveLength(3);
    expect(nodes.map((n) => n.name)).toEqual(['Grandmother', 'Mother', 'Daughter']);

    expect(edges).toHaveLength(2);
    expect(edges[0].sourceId).toBe('Grandmother');
    expect(edges[0].targetId).toBe('Mother');
    expect(edges[1].sourceId).toBe('Mother');
    expect(edges[1].targetId).toBe('Daughter');
  });

  it('should parse labeled connections with bracket syntax', () => {
    const script = `Grid -[Electricity]-> Home`;

    const { nodes, edges } = parseWiremarksDSL(script);

    expect(nodes).toHaveLength(2);
    expect(nodes.map((n) => n.name)).toEqual(['Grid', 'Home']);

    expect(edges).toHaveLength(1);
    expect(edges[0].label).toBe('Electricity');
    expect(edges[0].sourceId).toBe('Grid');
    expect(edges[0].targetId).toBe('Home');
  });

  it('should ignore comment lines starting with #', () => {
    const script = `
      # This is a comment
      EntityA -> EntityB
      # Another comment line
    `;

    const { nodes, edges } = parseWiremarksDSL(script);

    expect(nodes).toHaveLength(2);
    expect(edges).toHaveLength(1);
  });

  it('should parse hyphenated entity names correctly', () => {
    const script = `react-two.js -[wraps]-> two.js`;

    const { nodes, edges } = parseWiremarksDSL(script);

    expect(nodes.map((n) => n.name)).toEqual(['react-two.js', 'two.js']);
    expect(edges[0].sourceId).toBe('react-two.js');
    expect(edges[0].targetId).toBe('two.js');
  });

  it('should handle empty or invalid inputs gracefully', () => {
    expect(parseWiremarksDSL('')).toEqual({ nodes: [], edges: [] });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect(parseWiremarksDSL(null as any)).toEqual({ nodes: [], edges: [] });
  });
});
