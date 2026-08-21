import { Column, DiffsModel, SortMode, StatLineDatum, TextDoc } from '../types';
import { CHARACTER_WIDTH, COLUMN_PITCH, LEADING, SHARED_COLUMN_X } from '../constants';
import { analyzeText, sortLines } from './analyze';
import { mergeTexts, SHARED_COLOR } from './merge';

export function buildModel(texts: TextDoc[], mode: SortMode): DiffsModel {
  // 1 & 2 & 3. Tokenize, stem, and analyze each text
  const analyzed = texts.map((t) => analyzeText(t));

  // 4. Merge across texts to resolve shared words
  const merged = mergeTexts(analyzed);

  const byStem = new Map<string, StatLineDatum[]>();

  function registerDatum(datum: StatLineDatum) {
    let list = byStem.get(datum.stem);
    if (!list) {
      list = [];
      byStem.set(datum.stem, list);
    }
    list.push(datum);
  }

  // 5 & 6. Sort and lay out text columns
  const textColumns: Column[] = merged.columns.map((col, colIdx) => {
    const colX = (colIdx + 1) * COLUMN_PITCH;
    const sorted = sortLines(col.lines, mode);

    const allData: StatLineDatum[] = sorted.map((line, rowIdx) => {
      const width = (line.word.length + 1 + String(line.count).length) * CHARACTER_WIDTH;
      const datum: StatLineDatum = {
        key: `${col.id}:${line.stem}`,
        word: line.word,
        stem: line.stem,
        count: line.count,
        x: colX,
        y: rowIdx * LEADING * 1.15,
        width,
        visible: line.visible,
      };
      registerDatum(datum);
      return datum;
    });

    const visibleLines = allData.filter((d) => d.visible);
    const points = visibleLines.map((d) => ({ x: colX, y: d.y }));
    const top = points.length > 0 ? points[0].y : 0;
    const bottom = points.length > 0 ? points[points.length - 1].y : 0;

    return {
      id: col.id,
      name: col.name,
      color: col.color,
      x: colX,
      lines: visibleLines,
      graph: {
        top,
        bottom,
        points,
      },
    };
  });

  // Sort and lay out shared column
  const sharedSorted = sortLines(merged.sharedColumn.lines, mode);
  const sharedAllData: StatLineDatum[] = sharedSorted.map((line, rowIdx) => {
    const width = (line.word.length + 1 + String(line.count).length) * CHARACTER_WIDTH;
    const datum: StatLineDatum = {
      key: `shared:${line.stem}`,
      word: line.word,
      stem: line.stem,
      count: line.count,
      x: SHARED_COLUMN_X,
      y: rowIdx * LEADING * 1.15,
      width,
      visible: line.visible,
    };
    registerDatum(datum);
    return datum;
  });

  const sharedVisible = sharedAllData.filter((d) => d.visible);
  const sharedPoints = sharedVisible.map((d) => ({ x: SHARED_COLUMN_X, y: d.y }));
  const sharedTop = sharedPoints.length > 0 ? sharedPoints[0].y : 0;
  const sharedBottom = sharedPoints.length > 0 ? sharedPoints[sharedPoints.length - 1].y : 0;

  const sharedColumn: Column = {
    id: 'shared',
    name: merged.sharedColumn.name,
    color: SHARED_COLOR,
    x: SHARED_COLUMN_X,
    lines: sharedVisible,
    graph: {
      top: sharedTop,
      bottom: sharedBottom,
      points: sharedPoints,
    },
  };

  // Compute total visible lines and total input characters
  let totalLines = sharedVisible.length;
  for (const c of textColumns) {
    totalLines += c.lines.length;
  }

  let totalChars = 0;
  for (const t of texts) {
    totalChars += t.body.length;
  }

  return {
    columns: textColumns,
    shared: sharedColumn,
    byStem,
    totalLines,
    totalChars,
  };
}
