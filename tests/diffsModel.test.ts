import { describe, expect, it } from 'vitest';
import { buildModel } from '../src/playgrounds/diffs/model/layout';
import { TextDoc } from '../src/playgrounds/diffs/types';
import { COLUMN_PITCH, LEADING, SHARED_COLUMN_X } from '../src/playgrounds/diffs/constants';

describe('diffs model building & layout', () => {
  const sampleTexts: TextDoc[] = [
    {
      id: 't1',
      name: 'Text 1',
      color: 'rgb(255, 0, 0)',
      body: 'quick brown fox quick',
    },
    {
      id: 't2',
      name: 'Text 2',
      color: 'rgb(0, 255, 0)',
      body: 'lazy brown fox dog',
    },
  ];

  it('collapses repeat occurrences within a text into count', () => {
    const model = buildModel([sampleTexts[0]], 'chronologic');
    const col = model.columns[0];
    const quickLine = col.lines.find((l) => l.word === 'quick');
    expect(quickLine).toBeDefined();
    expect(quickLine?.count).toBe(2);
  });

  it('merges cross-text shared words into shared column and hides from source columns', () => {
    const model = buildModel(sampleTexts, 'chronologic');

    // 'brown' and 'fox' appear in both texts
    const sharedStems = model.shared.lines.map((l) => l.stem);
    expect(sharedStems).toContain('brown');
    expect(sharedStems).toContain('fox');

    // In text columns, 'brown' and 'fox' are not in visible lines
    const t1Stems = model.columns[0].lines.map((l) => l.stem);
    const t2Stems = model.columns[1].lines.map((l) => l.stem);

    expect(t1Stems).not.toContain('brown');
    expect(t1Stems).not.toContain('fox');
    expect(t2Stems).not.toContain('brown');
    expect(t2Stems).not.toContain('fox');
  });

  it('sorts lines by frequency', () => {
    const model = buildModel([sampleTexts[0]], 'frequency');
    const col = model.columns[0];
    // 'quick' has count 2, 'brown' and 'fox' have count 1
    expect(col.lines[0].word).toBe('quick');
  });

  it('sorts lines alphabetically', () => {
    const model = buildModel([sampleTexts[0]], 'alphabetic');
    const col = model.columns[0];
    const stems = col.lines.map((l) => l.stem);
    expect(stems).toEqual([...stems].sort());
  });

  it('computes expected coordinates for text columns and shared column', () => {
    const model = buildModel(sampleTexts, 'chronologic');

    expect(model.shared.x).toBe(SHARED_COLUMN_X);
    expect(model.columns[0].x).toBe(1 * COLUMN_PITCH);
    expect(model.columns[1].x).toBe(2 * COLUMN_PITCH);

    model.columns[0].lines.forEach((line, idx) => {
      expect(line.y).toBeCloseTo(idx * LEADING * 1.15);
      expect(line.x).toBe(1 * COLUMN_PITCH);
    });
  });
});

describe('shared column display word', () => {
  it('takes its word from the same occurrence that supplies its index', () => {
    // "dog" appears late in t1 ("dogs", index 3) but first in t2 (index 0).
    // The shared line sorts by the earliest index, so it must display the word
    // belonging to that earliest occurrence.
    const model = buildModel(
      [
        {
          id: 't1',
          name: 'Text 1',
          color: 'rgb(255, 0, 0)',
          body: 'alpha beta gamma dogs',
        },
        {
          id: 't2',
          name: 'Text 2',
          color: 'rgb(0, 255, 0)',
          body: 'dog delta',
        },
      ],
      'chronologic'
    );

    const shared = model.shared.lines.find((line) => line.stem === 'dog');
    expect(shared).toBeDefined();
    expect(shared?.word).toBe('dog');
    expect(shared?.count).toBe(2);
  });
});
