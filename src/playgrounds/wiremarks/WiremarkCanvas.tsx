import { useEffect, useRef, useState } from 'react';
import { useTwo, useFrame, Group, RefGroup } from 'react-two.js';
import Two from 'two.js';
// @ts-expect-error - ZUI module path from two.js extras
import { ZUI } from 'two.js/extras/jsm/zui.js';
import { useWiremarksGraph } from './hooks/useWiremarksGraph';
import { WiremarksScene } from './components/WiremarksScene';
import { WiremarkNode } from './types';

const eventParams = { passive: false };

interface ZUIInstance {
  scale: number;
  addLimits: (min: number, max: number) => void;
  translateSurface: (x: number, y: number) => void;
  zoomBy: (delta: number, x: number, y: number) => void;
  clientToSurface: (x: number, y: number) => { x: number; y: number; z: number };
}

interface WiremarkCanvasProps {
  instructions: string;
}

export function WiremarkCanvas({ instructions }: WiremarkCanvasProps) {
  const { two } = useTwo();
  const sceneGroupRef = useRef<RefGroup | null>(null);
  const zuiRef = useRef<ZUIInstance | null>(null);

  const [dashOffset, setDashOffset] = useState(0);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  const { nodes, edges, nodesMap, updateNodePosition } = useWiremarksGraph(instructions);

  // Smooth 60fps dash offset animation loop
  useFrame((_, frameDelta) => {
    setDashOffset((prev) => prev - frameDelta / 10);
  });

  // Initialize ZUI on scene group
  useEffect(() => {
    if (!two || !sceneGroupRef.current) return;

    const domElement = two.renderer.domElement;
    const sceneGroup = sceneGroupRef.current;

    const zui: ZUIInstance = new ZUI(sceneGroup, domElement);
    zui.addLimits(0.06, 8);
    zuiRef.current = zui;

    const setGrabbing = (className: string) => {
      const container = domElement.parentElement;
      if (container) {
        container.className = ['wireframe', className].filter(Boolean).join(' ');
      }
    };

    const getEntityUnderMouse = (clientX: number, clientY: number): WiremarkNode | null => {
      if (!zuiRef.current) return null;
      const pt = zuiRef.current.clientToSurface(clientX, clientY);

      for (const node of nodes) {
        const halfW = node.width / 2;
        const halfH = node.height / 2;
        if (
          pt.x >= node.x - halfW &&
          pt.x <= node.x + halfW &&
          pt.y >= node.y - halfH &&
          pt.y <= node.y + halfH
        ) {
          return node;
        }
      }
      return null;
    };

    const mouse = new Two.Vector();
    let touches: Touch[] = [];
    let movingNode: WiremarkNode | null = null;
    let distance = 0;

    function mousedown(e: MouseEvent) {
      setGrabbing('grabbing');
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      movingNode = getEntityUnderMouse(e.clientX, e.clientY);

      if (movingNode) {
        setDraggingNodeId(movingNode.id);
        setGrabbing('dragging');
      }

      window.addEventListener('mousemove', mousemove, false);
      window.addEventListener('mouseup', mouseup, false);
    }

    function mousemove(e: MouseEvent) {
      const dx = e.clientX - mouse.x;
      const dy = e.clientY - mouse.y;

      if (movingNode && zuiRef.current) {
        const newX = movingNode.x + dx / zuiRef.current.scale;
        const newY = movingNode.y + dy / zuiRef.current.scale;
        updateNodePosition(movingNode.id, newX, newY);
        movingNode = { ...movingNode, x: newX, y: newY };
      } else if (zuiRef.current) {
        zuiRef.current.translateSurface(dx, dy);
      }
      mouse.set(e.clientX, e.clientY);
    }

    function mouseup() {
      setGrabbing('');
      movingNode = null;
      setDraggingNodeId(null);
      window.removeEventListener('mousemove', mousemove, false);
      window.removeEventListener('mouseup', mouseup, false);
    }

    function mousewheel(e: WheelEvent) {
      if (!zuiRef.current) return;
      const wheelE = e as WheelEvent & { wheelDeltaY?: number };
      const dy = (wheelE.wheelDeltaY ? wheelE.wheelDeltaY : -wheelE.deltaY) / 1000;
      zuiRef.current.zoomBy(dy, e.clientX, e.clientY);
    }

    function touchstart(e: TouchEvent) {
      e.preventDefault();
      switch (e.touches.length) {
        case 2:
          pinchstart(e);
          break;
        case 1:
          panstart(e);
          break;
      }
    }

    function touchmove(e: TouchEvent) {
      e.preventDefault();
      switch (e.touches.length) {
        case 2:
          pinchmove(e);
          break;
        case 1:
          panmove(e);
          break;
      }
    }

    function touchend(e: TouchEvent) {
      e.preventDefault();
      setGrabbing('');
      movingNode = null;
      setDraggingNodeId(null);
      touches = [];
      const touch = e.touches[0];
      if (touch) {
        mouse.x = touch.clientX;
        mouse.y = touch.clientY;
      }
    }

    function panstart(e: TouchEvent) {
      const touch = e.touches[0];
      mouse.x = touch.clientX;
      mouse.y = touch.clientY;
      movingNode = getEntityUnderMouse(touch.clientX, touch.clientY);
      if (movingNode) {
        setDraggingNodeId(movingNode.id);
        setGrabbing('dragging');
      } else {
        setGrabbing('grabbing');
      }
    }

    function panmove(e: TouchEvent) {
      const touch = e.touches[0];
      const dx = touch.clientX - mouse.x;
      const dy = touch.clientY - mouse.y;

      if (movingNode && zuiRef.current) {
        const newX = movingNode.x + dx / zuiRef.current.scale;
        const newY = movingNode.y + dy / zuiRef.current.scale;
        updateNodePosition(movingNode.id, newX, newY);
        movingNode = { ...movingNode, x: newX, y: newY };
      } else if (zuiRef.current) {
        zuiRef.current.translateSurface(dx, dy);
      }
      mouse.set(touch.clientX, touch.clientY);
    }

    function pinchstart(e: TouchEvent) {
      for (let i = 0; i < e.touches.length; i++) {
        touches[i] = e.touches[i];
      }
      const a = touches[0];
      const b = touches[1];
      const dx = b.clientX - a.clientX;
      const dy = b.clientY - a.clientY;
      distance = Math.sqrt(dx * dx + dy * dy);
      mouse.x = dx / 2 + a.clientX;
      mouse.y = dy / 2 + a.clientY;
    }

    function pinchmove(e: TouchEvent) {
      for (let i = 0; i < e.touches.length; i++) {
        touches[i] = e.touches[i];
      }
      const a = touches[0];
      const b = touches[1];
      const dx = b.clientX - a.clientX;
      const dy = b.clientY - a.clientY;
      const d = Math.sqrt(dx * dx + dy * dy);
      const delta = d - distance;
      if (zuiRef.current) {
        zuiRef.current.zoomBy(delta / 250, mouse.x, mouse.y);
      }
      distance = d;
    }

    if (window.navigator.maxTouchPoints <= 0) {
      domElement.addEventListener('mousedown', mousedown, eventParams);
      domElement.addEventListener('mousewheel', mousewheel as unknown as EventListener, eventParams);
      domElement.addEventListener('wheel', mousewheel as unknown as EventListener, eventParams);
    } else {
      domElement.addEventListener('touchstart', touchstart, eventParams);
      domElement.addEventListener('touchmove', touchmove, eventParams);
      domElement.addEventListener('touchend', touchend, eventParams);
      domElement.addEventListener('touchcancel', touchend, eventParams);
    }

    return () => {
      domElement.removeEventListener('mousedown', mousedown, eventParams);
      domElement.removeEventListener('mousewheel', mousewheel as unknown as EventListener, eventParams);
      domElement.removeEventListener('wheel', mousewheel as unknown as EventListener, eventParams);
      domElement.removeEventListener('touchstart', touchstart, eventParams);
      domElement.removeEventListener('touchmove', touchmove, eventParams);
      domElement.removeEventListener('touchend', touchend, eventParams);
      domElement.removeEventListener('touchcancel', touchend, eventParams);
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
