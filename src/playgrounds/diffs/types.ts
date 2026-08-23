export const SORT_MODES = ['chronologic', 'frequency', 'alphabetic'] as const;

export type SortMode = (typeof SORT_MODES)[number];

/** Guards untrusted input, such as a hand-edited localStorage payload. */
export function isSortMode(value: unknown): value is SortMode {
  return SORT_MODES.includes(value as SortMode);
}

export interface TextDoc {
  id: string;
  name: string;
  color: string; // rgb(...) string, assigned on creation
  body: string;
}

export interface StatLineDatum {
  key: string; // `${columnId}:${stem}`
  word: string; // display form (first occurrence)
  stem: string;
  count: number;
  x: number;
  y: number;
  width: number;
  visible: boolean; // false for stopwords or hidden in source text when merged
}

export interface Column {
  id: string; // a TextDoc id, or the literal 'shared'
  name: string; // the TextDoc title, or 'Shared Words'
  color: string;
  x: number;
  lines: StatLineDatum[];
  graph: {
    top: number;
    bottom: number;
    points: { x: number; y: number }[];
  };
}

export interface DiffsModel {
  columns: Column[]; // one per text
  shared: Column;
  byStem: Map<string, StatLineDatum[]>; // for highlight + arc lookup
  totalLines: number;
  totalChars: number;
}
