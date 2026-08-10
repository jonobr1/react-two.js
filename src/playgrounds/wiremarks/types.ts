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

export interface GraphData {
  nodes: WiremarkNode[];
  edges: WiremarkEdge[];
}
