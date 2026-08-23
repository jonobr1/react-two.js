import { SortMode, TextDoc } from '../types';
import { isStopword } from '../stopwords';
import { tokenize } from './tokenize';
import { stem } from './stem';

export interface UnmergedLine {
  textId: string;
  word: string;
  stem: string;
  count: number;
  firstIndex: number;
  visible: boolean;
}

export interface AnalyzedText {
  id: string;
  name: string;
  color: string;
  lines: UnmergedLine[];
  byStem: Map<string, UnmergedLine>;
}

export function sortLines<T extends { firstIndex: number; count: number; stem: string }>(
  lines: T[],
  mode: SortMode
): T[] {
  const result = [...lines];
  switch (mode) {
    case 'chronologic':
      return result.sort((a, b) => a.firstIndex - b.firstIndex);
    case 'frequency':
      return result.sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }
        return a.firstIndex - b.firstIndex;
      });
    case 'alphabetic':
      return result.sort((a, b) => {
        const sa = a.stem.toLowerCase();
        const sb = b.stem.toLowerCase();
        if (sa < sb) return -1;
        if (sa > sb) return 1;
        return a.firstIndex - b.firstIndex;
      });
  }
}

export function analyzeText(textDoc: TextDoc): AnalyzedText {
  const tokens = tokenize(textDoc.body);
  const byStem = new Map<string, UnmergedLine>();
  const lines: UnmergedLine[] = [];

  for (const token of tokens) {
    const s = stem(token.word);
    const existing = byStem.get(s);
    if (existing) {
      existing.count += 1;
    } else {
      const newLine: UnmergedLine = {
        textId: textDoc.id,
        word: token.word,
        stem: s,
        count: 1,
        firstIndex: token.index,
        visible: !isStopword(token.word),
      };
      byStem.set(s, newLine);
      lines.push(newLine);
    }
  }

  return {
    id: textDoc.id,
    name: textDoc.name,
    color: textDoc.color,
    lines,
    byStem,
  };
}
