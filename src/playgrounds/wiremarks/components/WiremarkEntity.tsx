import { useState, useCallback, useEffect, useRef } from 'react';
import { Group, RoundedRectangle, Text, type TwoEvent } from 'react-two.js';
import { WiremarkNode } from '../types';
import { unit } from '../constants';

interface WiremarkEntityProps {
  node: WiremarkNode;
  isDragging?: boolean;
  onDragStart?: (nodeId: string, clientX: number, clientY: number) => void;
  onDrag?: (nodeId: string, clientX: number, clientY: number) => void;
  onDragEnd?: (nodeId: string) => void;
}

export function WiremarkEntity({
  node,
  isDragging = false,
  onDragStart,
  onDrag,
  onDragEnd,
}: WiremarkEntityProps) {
  const [isHovered, setIsHovered] = useState(false);
  const borderWidth = unit * 0.015;

  /**
   * Ends the in-flight drag, if any. Held in a ref so the unmount effect can
   * reach the listeners registered by an earlier render — editing the DSL
   * mid-drag re-parses the graph and unmounts this entity before pointerup
   * ever arrives.
   */
  const endDragRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    return () => endDragRef.current?.();
  }, []);

  const handlePointerDown = useCallback(
    (e: TwoEvent) => {
      // Keeps useZUI from also treating this as a background pan.
      e.stopPropagation();

      // Never let two drags stack up on the same entity.
      endDragRef.current?.();

      const native = e.nativeEvent as PointerEvent;
      onDragStart?.(node.id, native.clientX, native.clientY);

      const handlePointerMove = (moveEvt: PointerEvent) => {
        onDrag?.(node.id, moveEvt.clientX, moveEvt.clientY);
      };

      const endDrag = () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', endDrag);
        window.removeEventListener('pointercancel', endDrag);
        endDragRef.current = null;
        onDragEnd?.(node.id);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', endDrag);
      window.addEventListener('pointercancel', endDrag);
      endDragRef.current = endDrag;
    },
    [node.id, onDragStart, onDrag, onDragEnd],
  );

  return (
    <Group
      x={node.x}
      y={node.y}
      onPointerDown={handlePointerDown}
      onPointerOver={() => setIsHovered(true)}
      onPointerOut={() => setIsHovered(false)}
    >
      <RoundedRectangle
        width={node.width}
        height={node.height}
        radius={8}
        fill={node.colors.fill}
        stroke={isHovered || isDragging ? '#3b82f6' : node.colors.stroke}
        linewidth={
          isDragging
            ? borderWidth * 2.5
            : isHovered
              ? borderWidth * 1.8
              : borderWidth
        }
      />
      <Text
        value={node.name}
        family='"Inter", sans-serif'
        size={unit * 0.1}
        fill={node.colors.textColor}
        baseline="middle"
        alignment="center"
      />
    </Group>
  );
}
