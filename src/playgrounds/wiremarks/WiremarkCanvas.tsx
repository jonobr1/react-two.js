import { useEffect, useRef, useState } from 'react';
import { useTwo, useFrame, Group, RefGroup } from 'react-two.js';
import Two from 'two.js';
import { useWiremarksGraph } from './hooks/useWiremarksGraph';
import { WiremarksScene } from './components/WiremarksScene';
import { WiremarkNode } from './types';

interface WiremarkCanvasProps {
  instructions: string;
}

export function WiremarkCanvas({ instructions }: WiremarkCanvasProps) {
  const { two } = useTwo();
  const sceneGroupRef = useRef<RefGroup | null>(null);

  const [dashOffset, setDashOffset] = useState(0);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  const { nodes, edges, nodesMap, updateNodePosition } = useWiremarksGraph(instructions);

  // Smooth 60fps dash offset animation loop
  useFrame((_, frameDelta) => {
    setDashOffset((prev) => prev - frameDelta / 10);
  });

  // Node Dragging Interaction without ZUI
  useEffect(() => {
    if (!two || !two.renderer.domElement) return;

    const domElement = two.renderer.domElement;

    const getEntityUnderMouse = (clientX: number, clientY: number): WiremarkNode | null => {
      const rect = domElement.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      for (const node of nodes) {
        const halfW = node.width / 2;
        const halfH = node.height / 2;
        if (
          x >= node.x - halfW &&
          x <= node.x + halfW &&
          y >= node.y - halfH &&
          y <= node.y + halfH
        ) {
          return node;
        }
      }
      return null;
    };

    const mouse = new Two.Vector();
    let movingNode: WiremarkNode | null = null;

    function mousedown(e: MouseEvent) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      movingNode = getEntityUnderMouse(e.clientX, e.clientY);

      if (movingNode) {
        setDraggingNodeId(movingNode.id);
      }

      window.addEventListener('mousemove', mousemove, false);
      window.addEventListener('mouseup', mouseup, false);
    }

    function mousemove(e: MouseEvent) {
      const dx = e.clientX - mouse.x;
      const dy = e.clientY - mouse.y;

      if (movingNode) {
        const newX = movingNode.x + dx;
        const newY = movingNode.y + dy;
        updateNodePosition(movingNode.id, newX, newY);
        movingNode = { ...movingNode, x: newX, y: newY };
      }
      mouse.set(e.clientX, e.clientY);
    }

    function mouseup() {
      movingNode = null;
      setDraggingNodeId(null);
      window.removeEventListener('mousemove', mousemove, false);
      window.removeEventListener('mouseup', mouseup, false);
    }

    domElement.addEventListener('mousedown', mousedown);

    return () => {
      domElement.removeEventListener('mousedown', mousedown);
      window.removeEventListener('mousemove', mousemove);
      window.removeEventListener('mouseup', mouseup);
    };
  }, [two, nodes, updateNodePosition]);

  return (
    <Group ref={sceneGroupRef}>
      <WiremarksScene
        nodes={nodes}
        edges={edges}
        nodesMap={nodesMap}
        dashOffset={dashOffset}
        draggingNodeId={draggingNodeId}
      />
    </Group>
  );
}
