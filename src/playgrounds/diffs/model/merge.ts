import { AnalyzedText, UnmergedLine } from './analyze';

export interface MergedTextColumn {
  id: string;
  name: string;
  color: string;
  lines: UnmergedLine[];
}

export interface MergedResult {
  columns: MergedTextColumn[];
  sharedColumn: MergedTextColumn;
}

export const SHARED_COLOR = 'rgb(120, 120, 120)';

export function mergeTexts(
  analyzed: AnalyzedText[],
  sharedColor: string = SHARED_COLOR
): MergedResult {
  // Map stem -> array of UnmergedLines across all text columns
  const stemOccurrences = new Map<string, UnmergedLine[]>();

  for (const text of analyzed) {
    for (const line of text.lines) {
      let list = stemOccurrences.get(line.stem);
      if (!list) {
        list = [];
        stemOccurrences.set(line.stem, list);
      }
      list.push(line);
    }
  }

  const sharedLines: UnmergedLine[] = [];

  for (const [s, occurrences] of stemOccurrences.entries()) {
    if (occurrences.length >= 2) {
      // Shared stem! Hide in owning columns and add to shared column.
      // The shared line sorts by the earliest occurrence, so its word and
      // visibility come from that same occurrence rather than from whichever
      // text happened to be scanned first.
      let totalCount = 0;
      let earliest = occurrences[0];

      for (const occ of occurrences) {
        totalCount += occ.count;
        if (occ.firstIndex < earliest.firstIndex) {
          earliest = occ;
        }
      }

      // Read before hiding: the loop below clears `visible` on every
      // occurrence, `earliest` included.
      const { word, firstIndex, visible } = earliest;

      for (const occ of occurrences) {
        occ.visible = false;
      }

      sharedLines.push({
        textId: 'shared',
        word,
        stem: s,
        count: totalCount,
        firstIndex,
        visible,
      });
    }
  }

  const columns: MergedTextColumn[] = analyzed.map((text) => ({
    id: text.id,
    name: text.name,
    color: text.color,
    lines: text.lines,
  }));

  const sharedColumn: MergedTextColumn = {
    id: 'shared',
    name: 'Shared Words',
    color: sharedColor,
    lines: sharedLines,
  };

  return {
    columns,
    sharedColumn,
  };
}
