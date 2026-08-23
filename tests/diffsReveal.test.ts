import { describe, expect, it } from 'vitest';
import { buildModel } from '../src/playgrounds/diffs/model/layout';
import { TextDoc } from '../src/playgrounds/diffs/types';

describe('progressive reveal calculation', () => {
  it('calculates expected totalLines and chunk formula boundaries', () => {
    const texts: TextDoc[] = [
      {
        id: '1',
        name: 'T1',
        color: 'rgb(0,0,0)',
        body: 'alpha beta gamma delta epsilon',
      },
    ];

    const model = buildModel(texts, 'chronologic');

    // Formula: clamp(floor(totalChars / 100), 1, 250)
    const chunkSize = Math.min(
      Math.max(Math.floor(model.totalChars / 100), 1),
      250
    );

    expect(model.totalLines).toBe(5);
    expect(chunkSize).toBe(1);
  });

  it('caps max chunk size at 250 for huge text bodies', () => {
    const hugeBody = 'a '.repeat(50000);
    const texts: TextDoc[] = [
      {
        id: '1',
        name: 'T1',
        color: 'rgb(0,0,0)',
        body: hugeBody,
      },
    ];

    const model = buildModel(texts, 'chronologic');
    const chunkSize = Math.min(
      Math.max(Math.floor(model.totalChars / 100), 1),
      250
    );

    expect(chunkSize).toBe(250);
  });
});
