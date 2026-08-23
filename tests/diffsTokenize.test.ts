import { describe, expect, it } from 'vitest';
import { tokenize } from '../src/playgrounds/diffs/model/tokenize';
import { isStopword } from '../src/playgrounds/diffs/stopwords';

describe('diffs tokenize & stopwords', () => {
  it('strips trailing contractions and non-word characters', () => {
    const result = tokenize("they'll don't cat's world!");
    expect(result.map((t) => t.word)).toEqual(['they', 'don', 'cat', 'world']);
  });

  it('preserves original token index', () => {
    const result = tokenize('first   second   third');
    expect(result.map((t) => t.index)).toEqual([0, 1, 2]);
  });

  it('filters empty or non-word tokens', () => {
    const result = tokenize('   !@#$%   \n\t   ');
    expect(result).toEqual([]);
  });

  it('identifies stopwords correctly', () => {
    expect(isStopword('the')).toBe(true);
    expect(isStopword('is')).toBe(true);
    expect(isStopword('and')).toBe(true);
    expect(isStopword('fox')).toBe(false);
    expect(isStopword('quick')).toBe(false);
  });
});
