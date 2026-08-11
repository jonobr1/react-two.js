import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { parseWiremarksDSL } from '../parser';
import { layoutBlocks } from '../layout';
import { clearPositions, loadPositions, savePositions } from '../storage';
import { GraphData, WiremarkNode, Vector2D } from '../types';
import { nodeWidth, nodeHeight } from '../constants';

const NODE_SIZE = { width: nodeWidth, height: nodeHeight };

/**
 * Builds the renderable graph from DSL text.
 *
 * Position precedence is: a user's dragged position, otherwise whatever the
 * layout algorithm computes. Editing the text therefore reflows untouched
 * nodes while leaving deliberately placed ones alone.
 *
 * @param instructions - The Wiremarks DSL source.
 * @param resetToken - Increment to discard all dragged positions.
 */
export function useWiremarksGraph(instructions: string, resetToken = 0) {
  // Dragged positions, seeded from the previous session.
  const [positionOverrides, setPositionOverrides] = useState<
    Record<string, Vector2D>
  >(() => loadPositions());

  // Parse DSL text into a graph, without coordinates.
  const baseGraph = useMemo<GraphData>(() => {
    return parseWiremarksDSL(instructions);
  }, [instructions]);

  // Each block lays out on its own, then stacks below the previous one.
  const layout = useMemo(() => {
    return layoutBlocks(baseGraph.blocks, NODE_SIZE);
  }, [baseGraph]);

  const nodes = useMemo<WiremarkNode[]>(() => {
    return baseGraph.nodes.map((node) => {
      const position = positionOverrides[node.id] ??
        layout.get(node.id) ?? { x: 0, y: 0 };

      return { ...node, x: position.x, y: position.y };
    });
  }, [baseGraph.nodes, layout, positionOverrides]);

  // Map for fast node lookup by ID
  const nodesMap = useMemo<Map<string, WiremarkNode>>(() => {
    const map = new Map<string, WiremarkNode>();
    for (const node of nodes) {
      map.set(node.id, node);
    }
    return map;
  }, [nodes]);

  // Latest values for `commitPositions`, which is invoked from a pointerup
  // handler that may still hold a closure from before the drag began.
  const latest = useRef<{ overrides: Record<string, Vector2D>; ids: string[] }>(
    {
      overrides: positionOverrides,
      ids: [],
    },
  );
  useEffect(() => {
    latest.current = {
      overrides: positionOverrides,
      ids: nodes.map((node) => node.id),
    };
  }, [positionOverrides, nodes]);

  // State only. This runs on every pointermove, so it must stay off the
  // localStorage path.
  const updateNodePosition = useCallback(
    (nodeId: string, x: number, y: number) => {
      setPositionOverrides((prev) => ({
        ...prev,
        [nodeId]: { x, y },
      }));
    },
    [],
  );

  /** Persist dragged positions. Call when a drag finishes, not during it. */
  const commitPositions = useCallback(() => {
    savePositions(latest.current.overrides, latest.current.ids);
  }, []);

  const previousResetToken = useRef(resetToken);
  useEffect(() => {
    if (previousResetToken.current === resetToken) {
      return;
    }
    previousResetToken.current = resetToken;
    setPositionOverrides({});
    clearPositions();
  }, [resetToken]);

  return {
    nodes,
    edges: baseGraph.edges,
    nodesMap,
    updateNodePosition,
    commitPositions,
  };
}
