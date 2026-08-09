import { useState, useCallback } from 'react';
import { Group, RoundedRectangle, Text, TwoEvent } from 'react-two.js';
import { WiremarkNode } from '../types';
import { unit } from '../constants';

interface WiremarkEntityProps {
  node: WiremarkNode;
  isDragging?: boolean;
  onDragStart?: (nodeId: string, event: TwoEvent) => void;
  onDrag?: (nodeId: string, dx: number, dy: number) => void;
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
      e.stopPropagation();
      onDragStart?.(node.id, e);

      const startX = e.nativeEvent.clientX;
      const startY = e.nativeEvent.clientY;

      const handlePointerMove = (moveEvt: MouseEvent) => {
        const dx = moveEvt.clientX - startX;
        const dy = moveEvt.clientY - startY;
        onDrag?.(node.id, dx, dy);
      };

      const handlePointerUp = () => {
        onDragEnd?.(node.id);
        setIsHovered(false);
        window.removeEventListener('mousemove', handlePointerMove);
        window.removeEventListener('mouseup', handlePointerUp);
      };

      window.addEventListener('mousemove', handlePointerMove);
      window.addEventListener('mouseup', handlePointerUp);
    },
    [node.id, onDragStart, onDrag, onDragEnd]
  );

  return (
    <Group x={node.x} y={node.y}>
      <RoundedRectangle
        width={node.width}
        height={node.height}
        radius={8}
        fill={node.colors.fill}
        stroke={isHovered || isDragging ? '#3b82f6' : node.colors.stroke}
        linewidth={isDragging ? borderWidth * 2.5 : isHovered ? borderWidth * 1.8 : borderWidth}
        onPointerDown={handlePointerDown}
        onPointerOver={() => setIsHovered(true)}
        onPointerEnter={() => setIsHovered(true)}
        onPointerOut={() => setIsHovered(false)}
        onPointerLeave={() => setIsHovered(false)}
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
