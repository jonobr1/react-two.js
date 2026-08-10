import { useMemo } from 'react';
import { Group } from 'react-two.js';
import { WiremarkNode, WiremarkEdge } from '../types';
import { WiremarkEntity } from './WiremarkEntity';
import { WiremarkConnection } from './WiremarkConnection';

interface WiremarksSceneProps {
  nodes: WiremarkNode[];
  edges: WiremarkEdge[];
  nodesMap: Map<string, WiremarkNode>;
  dashOffset?: number;
  draggingNodeId?: string | null;
  onDragStart?: (nodeId: string, clientX: number, clientY: number) => void;
  onDrag?: (nodeId: string, clientX: number, clientY: number) => void;
  onDragEnd?: (nodeId: string) => void;
}

export function WiremarksScene({
  nodes,
  edges,
  nodesMap,
  dashOffset = 0,
  draggingNodeId,
  onDragStart,
  onDrag,
  onDragEnd,
}: WiremarksSceneProps) {
  // Compute total connections per source node and track offset indices
  const connectionCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const edge of edges) {
      counts.set(edge.sourceId, (counts.get(edge.sourceId) || 0) + 1);
    }
    return counts;
  }, [edges]);

  // Compute offset index for each edge from its source node
  const edgeOffsetIndices = useMemo(() => {
    const tracker = new Map<string, number>();
    const indices = new Map<string, number>();

    for (const edge of edges) {
      const idx = tracker.get(edge.sourceId) || 0;
      indices.set(edge.id, idx);
      tracker.set(edge.sourceId, idx + 1);
    }

    return indices;
  }, [edges]);

  return (
    // wiremark
    <Group>
      {/* connections */}
      <Group>
        {edges.map((edge) => {
          const sourceNode = nodesMap.get(edge.sourceId);
          const targetNode = nodesMap.get(edge.targetId);
          const sourceOffsetIndex = edgeOffsetIndices.get(edge.id) || 0;
          const totalSourceConnections =
            connectionCounts.get(edge.sourceId) || 1;

          return (
            <WiremarkConnection
              key={edge.id}
              edge={edge}
              sourceNode={sourceNode}
              targetNode={targetNode}
              sourceOffsetIndex={sourceOffsetIndex}
              totalSourceConnections={totalSourceConnections}
              dashOffset={dashOffset}
            />
          );
        })}
      </Group>

      {/* entities */}
      <Group>
        {nodes.map((node) => (
          <WiremarkEntity
            key={node.id}
            node={node}
            isDragging={draggingNodeId === node.id}
            onDragStart={onDragStart}
            onDrag={onDrag}
            onDragEnd={onDragEnd}
          />
        ))}
      </Group>
    </Group>
  );
}
