import { useState, useCallback } from 'react';
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

  const handlePointerDown = useCallback(
    (e: TwoEvent) => {
      // Keeps useZUI from also treating this as a background pan.
      e.stopPropagation();

      const native = e.nativeEvent as PointerEvent;
      onDragStart?.(node.id, native.clientX, native.clientY);

      const handlePointerMove = (moveEvt: PointerEvent) => {
        onDrag?.(node.id, moveEvt.clientX, moveEvt.clientY);
      };

      const handlePointerUp = () => {
        onDragEnd?.(node.id);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        window.removeEventListener('pointercancel', handlePointerUp);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);
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
