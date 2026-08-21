import { memo, useCallback } from 'react';
import { Group, RoundedRectangle, Text } from 'react-two.js';
import { FONT_FAMILY, LEADING, SIZE, TEXT_BASELINE } from '../constants';
import { StatLineDatum } from '../types';

export interface StatLineProps {
  datum: StatLineDatum;
  color: string;
  isHighlighted: boolean;
  highlightMode: boolean;
  onSelect: (stem: string) => void;
}

export const StatLine = memo(function StatLine({
  datum,
  color,
  isHighlighted,
  highlightMode,
  onSelect,
}: StatLineProps) {
  const handleSelect = useCallback(() => {
    onSelect(datum.stem);
  }, [onSelect, datum.stem]);

  // Exactly one handler: `click` and `pointerdown` are dispatched from separate
  // listeners, so wiring both fired the toggle twice and cancelled itself out.
  // Leaving it `undefined` outside highlight mode also unregisters the line
  // from hit testing, so `pan: 'background'` can still pan across the columns.
  return (
    <Group
      x={datum.x}
      y={datum.y}
      onPointerDown={highlightMode ? handleSelect : undefined}
    >
      <RoundedRectangle
        x={datum.width / 2}
        y={0}
        width={datum.width + LEADING}
        height={LEADING}
        radius={LEADING * 0.5}
        fill={color}
        stroke={isHighlighted ? 'yellow' : 'none'}
        linewidth={SIZE * 0.25}
      />
      <Text
        value={datum.word}
        x={0}
        y={SIZE * 0.33}
        alignment="left"
        baseline={TEXT_BASELINE}
        family={FONT_FAMILY}
        size={SIZE}
        fill="#ffffff"
        stroke="none"
      />
      <Text
        value={String(datum.count)}
        x={datum.width}
        y={SIZE * 0.25}
        alignment="right"
        baseline={TEXT_BASELINE}
        family={FONT_FAMILY}
        size={SIZE * 0.5}
        fill="#ffffff"
        stroke="none"
      />
    </Group>
  );
});
