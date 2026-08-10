import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type MutableRefObject,
} from 'react';
import { useZUI, Group, RefGroup, type ZUIControls } from 'react-two.js';
import { useWiremarksGraph } from './hooks/useWiremarksGraph';
import { WiremarksScene } from './components/WiremarksScene';

interface WiremarkCanvasProps {
  instructions: string;
  /** Receives the ZUI controls so DOM chrome outside <Canvas> can drive zoom. */
  controlsRef?: MutableRefObject<ZUIControls | null>;
  /** Called at most once per frame while the zoom level changes. */
  onZoomChange?: (scale: number) => void;
  /** Increment to discard every dragged node position. */
  resetToken?: number;
}

export function WiremarkCanvas({
  instructions,
  controlsRef,
  onZoomChange,
  resetToken,
}: WiremarkCanvasProps) {
  const sceneGroupRef = useRef<RefGroup | null>(null);

  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);
  const dragOriginRef = useRef<{
    pointer: { x: number; y: number };
    node: { x: number; y: number };
  } | null>(null);

  const { nodes, edges, nodesMap, updateNodePosition, commitPositions } =
    useWiremarksGraph(instructions, resetToken);

  const handleZoomChange = useCallback(
    (state: { scale: number }) => onZoomChange?.(state.scale),
    [onZoomChange],
  );

  // `pan: 'background'` leaves pointerdowns that landed on an entity alone, so
  // dragging a node never also pans the canvas.
  const zui = useZUI(sceneGroupRef, {
    minZoom: 0.25,
    maxZoom: 8,
    pan: 'background',
    onChange: handleZoomChange,
  });

  useEffect(() => {
    if (controlsRef) {
      controlsRef.current = zui;
    }
  }, [controlsRef, zui]);

  // The dash animation lives inside WiremarkConnection, which mutates its own
  // Two.js path each frame. Driving it from here through React state
  // re-rendered the whole graph 60 times a second.

  const handleDragStart = useCallback(
    (nodeId: string, clientX: number, clientY: number) => {
      setDraggingNodeId(nodeId);
      const node = nodesMap.get(nodeId);
      if (!node) return;

      const pointer = zui.clientToSurface(clientX, clientY);
      dragOriginRef.current = {
        pointer,
        node: { x: node.x, y: node.y },
      };
    },
    [nodesMap, zui],
  );

  const handleDrag = useCallback(
    (nodeId: string, clientX: number, clientY: number) => {
      const origin = dragOriginRef.current;
      if (!origin) return;

      // Diffing two surface-space points stays exact even if the view zooms
      // or pans partway through the drag.
      const pointer = zui.clientToSurface(clientX, clientY);
      updateNodePosition(
        nodeId,
        origin.node.x + (pointer.x - origin.pointer.x),
        origin.node.y + (pointer.y - origin.pointer.y),
      );
    },
    [updateNodePosition, zui],
  );

  const handleDragEnd = useCallback(() => {
    setDraggingNodeId(null);
    dragOriginRef.current = null;
    // Persist once the drag settles, never during it.
    commitPositions();
  }, [commitPositions]);

  return (
    // NOTE: this Group's translation and scale are owned by useZUI.
    // Do not add x, y, or scale props to it.
    <Group ref={sceneGroupRef}>
      <WiremarksScene
        nodes={nodes}
        edges={edges}
        nodesMap={nodesMap}
        draggingNodeId={draggingNodeId}
        onDragStart={handleDragStart}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
      />
    </Group>
  );
}
