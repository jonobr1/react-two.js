import { useState, useMemo, useCallback } from 'react';
import { parseWiremarksDSL } from '../parser';
import { GraphData, WiremarkNode, Vector2D } from '../types';

export function useWiremarksGraph(instructions: string) {
  // Store user-dragged node position overrides
  const [positionOverrides, setPositionOverrides] = useState<Record<string, Vector2D>>({});

  // Parse DSL text into base graph layout
  const baseGraph = useMemo<GraphData>(() => {
    return parseWiremarksDSL(instructions);
  }, [instructions]);

  // Combine base nodes layout with position overrides
  const nodes = useMemo<WiremarkNode[]>(() => {
    return baseGraph.nodes.map((node) => {
      const override = positionOverrides[node.id];
      if (override) {
        return {
          ...node,
          x: override.x,
          y: override.y,
        };
      }
      return node;
    });
  }, [baseGraph.nodes, positionOverrides]);

  // Map for fast node lookup by ID
  const nodesMap = useMemo<Map<string, WiremarkNode>>(() => {
    const map = new Map<string, WiremarkNode>();
    for (const node of nodes) {
      map.set(node.id, node);
    }
    return map;
  }, [nodes]);

  // Callback to update position of a specific node during/after drag
  const updateNodePosition = useCallback((nodeId: string, x: number, y: number) => {
    setPositionOverrides((prev) => ({
      ...prev,
      [nodeId]: { x, y },
    }));
  }, []);

  return {
    nodes,
    edges: baseGraph.edges,
    nodesMap,
    updateNodePosition,
  };
}
