import { useCallback, useRef, useState } from 'react';
import { useFrame, Group, RefGroup } from 'react-two.js';
import { useWiremarksGraph } from './hooks/useWiremarksGraph';
import { WiremarksScene } from './components/WiremarksScene';

interface WiremarkCanvasProps {
  instructions: string;
}

export function WiremarkCanvas({ instructions }: WiremarkCanvasProps) {
  const sceneGroupRef = useRef<RefGroup | null>(null);

  const [dashOffset, setDashOffset] = useState(0);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragStartNodePosRef = useRef<{ x: number; y: number } | null>(null);

  const { nodes, edges, nodesMap, updateNodePosition } = useWiremarksGraph(instructions);

  // Smooth 60fps dash offset animation loop
  useFrame((_, frameDelta) => {
    setDashOffset((prev) => prev - frameDelta / 10);
  });

  const handleDragStart = useCallback(
    (nodeId: string) => {
      setDraggingNodeId(nodeId);
      const node = nodesMap.get(nodeId);
      if (node) {
        dragStartNodePosRef.current = { x: node.x, y: node.y };
      }
    },
    [nodesMap]
  );

  const handleDrag = useCallback(
    (nodeId: string, dx: number, dy: number) => {
      const initialPos = dragStartNodePosRef.current;
      if (initialPos) {
        updateNodePosition(nodeId, initialPos.x + dx, initialPos.y + dy);
      }
    },
    [updateNodePosition]
  );

  const handleDragEnd = useCallback(() => {
    setDraggingNodeId(null);
    dragStartNodePosRef.current = null;
  }, []);

  return (
    <Group ref={sceneGroupRef}>
      <WiremarksScene
        nodes={nodes}
        edges={edges}
        nodesMap={nodesMap}
        dashOffset={dashOffset}
        draggingNodeId={draggingNodeId}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
      />
    </Group>
  );
}
