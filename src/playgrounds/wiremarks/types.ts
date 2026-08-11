export interface Vector2D {
  x: number;
  y: number;
}

export interface NodeColors {
  fill: string;
  stroke: string;
  textColor: string;
}

export interface WiremarkNode {
  id: string;
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  colors: NodeColors;
}

export interface WiremarkEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label?: string;
  color: string;
}

/**
 * A node as it comes out of the parser, before layout assigns coordinates.
 * The parser turns text into a graph; `layout.ts` turns a graph into geometry.
 */
export type ParsedNode = Omit<WiremarkNode, 'x' | 'y'>;

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
