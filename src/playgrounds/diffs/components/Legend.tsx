import { Circle, Group, Text } from 'react-two.js';
import { FONT_FAMILY, LEADING, SIZE, TEXT_BASELINE } from '../constants';
import { Column } from '../types';

export interface LegendProps {
  columns: Column[];
  shared: Column;
  canvasHeight: number;
  /** Canvas text needs a literal colour, so the theme has to be passed in. */
  isDark?: boolean;
}

export function Legend({
  columns,
  shared,
  canvasHeight,
  isDark = false,
}: LegendProps) {
  const totalItems = columns.length + 1;
  const labelColor = isDark ? '#ffffff' : '#000000';

  return (
    <Group x={0} y={canvasHeight}>
      {columns.map((col, i) => {
        const j = totalItems - i;
        const yPos = -j * LEADING;
        return (
          <Group key={col.id} y={yPos}>
            <Circle x={SIZE} y={0} radius={SIZE / 3} fill={col.color} stroke="none" />
            <Text
              value={col.name || `Text ${i + 1}`}
              x={SIZE * 2}
              y={SIZE * 0.33}
              alignment="left"
              baseline={TEXT_BASELINE}
              family={FONT_FAMILY}
              size={SIZE}
              fill={labelColor}
              stroke="none"
            />
          </Group>
        );
      })}
      <Group y={-LEADING}>
        <Circle x={SIZE} y={0} radius={SIZE / 3} fill={shared.color} stroke="none" />
        <Text
          value={shared.name || 'Shared Words'}
          x={SIZE * 2}
          y={SIZE * 0.33}
          alignment="left"
          baseline={TEXT_BASELINE}
          family={FONT_FAMILY}
          size={SIZE}
          fill={labelColor}
          stroke="none"
        />
      </Group>
    </Group>
  );
}
