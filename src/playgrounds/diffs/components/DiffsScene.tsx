import { useMemo } from 'react';
import { Group } from 'react-two.js';
import { DiffsModel } from '../types';
import { Arc } from './Arc';
import { GraphLine } from './GraphLine';
import { StatLine } from './StatLine';

export interface DiffsSceneProps {
  model: DiffsModel;
  revealed: number;
  selectedStem: string | null;
  highlightMode: boolean;
  onSelectStem: (stem: string) => void;
}

export function DiffsScene({
  model,
  revealed,
  selectedStem,
  highlightMode,
  onSelectStem,
}: DiffsSceneProps) {
  // Combine all columns: text columns + shared column
  const allColumns = useMemo(() => {
    return [...model.columns, model.shared];
  }, [model.columns, model.shared]);

  // Allocate revealed line counts across columns in order
  const revealedLinesPerColumn = useMemo(() => {
    const counts: number[] = [];
    let acc = 0;
    for (const col of allColumns) {
      const remaining = Math.max(0, revealed - acc);
      const countForCol = Math.min(col.lines.length, remaining);
      counts.push(countForCol);
      acc += col.lines.length;
    }
    return counts;
  }, [allColumns, revealed]);

  // Compute arcs when selectedStem is set
  const arcsData = useMemo(() => {
    if (!selectedStem) return [];
    const occurrences = model.byStem.get(selectedStem);
    if (!occurrences) return [];

    const visibleOccurrence = occurrences.find((o) => o.visible);
    const hiddenOccurrences = occurrences.filter((o) => !o.visible);

    if (!visibleOccurrence || hiddenOccurrences.length === 0) return [];

    return hiddenOccurrences.map((target, idx) => ({
      source: { x: visibleOccurrence.x, y: visibleOccurrence.y },
      target: { x: target.x, y: target.y },
      delay: idx * 250,
      key: `${target.key}:${idx}`,
    }));
  }, [selectedStem, model.byStem]);

  return (
    <Group y={100}>
      {/* 1. Arcs (bottom z-layer) */}
      <Group>
        {arcsData.map((arc) => (
          <Arc
            key={arc.key}
            source={arc.source}
            target={arc.target}
            delay={arc.delay}
          />
        ))}
      </Group>

      {/* 2. Graph lines (middle z-layer) */}
      <Group>
        {allColumns.map((col) => {
          const highlightYList = selectedStem
            ? col.lines
                .filter((l) => l.stem === selectedStem)
                .map((l) => l.y)
            : [];

          return (
            <GraphLine
              key={col.id}
              x={col.x}
              top={col.graph.top}
              bottom={col.graph.bottom}
              points={col.graph.points}
              highlightYList={highlightYList}
            />
          );
        })}
      </Group>

      {/* 3. Stat lines columns (top z-layer) */}
      <Group>
        {allColumns.map((col, colIdx) => {
          const countToRender = revealedLinesPerColumn[colIdx] || 0;
          const visibleSlice = col.lines.slice(0, countToRender);

          return (
            <Group key={col.id}>
              {visibleSlice.map((datum) => (
                <StatLine
                  key={datum.key}
                  datum={datum}
                  color={col.color}
                  isHighlighted={selectedStem === datum.stem}
                  highlightMode={highlightMode}
                  onSelect={onSelectStem}
                />
              ))}
            </Group>
          );
        })}
      </Group>
    </Group>
  );
}
