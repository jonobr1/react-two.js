import { Group, RoundedRectangle, Text } from 'react-two.js';
import { WiremarkNode } from '../types';
import { unit } from '../constants';

interface WiremarkEntityProps {
  node: WiremarkNode;
  isDragging?: boolean;
}

export function WiremarkEntity({ node, isDragging }: WiremarkEntityProps) {
  const borderWidth = unit * 0.015;

  return (
    <Group x={node.x} y={node.y}>
      <RoundedRectangle
        width={node.width}
        height={node.height}
        radius={8}
        fill={node.colors.fill}
        stroke={node.colors.stroke}
        linewidth={isDragging ? borderWidth * 2 : borderWidth}
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
