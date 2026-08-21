import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { DIFFS_STATE_VERSION, STORAGE_KEY } from '../src/playgrounds/diffs/constants';
import {
  clearStoredState,
  loadStoredState,
  saveStoredState,
} from '../src/playgrounds/diffs/storage';
import { TextDoc } from '../src/playgrounds/diffs/types';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('diffs localStorage persistence', () => {
  const sampleTexts: TextDoc[] = [
    {
      id: 't1',
      name: 'Sample 1',
      color: 'rgb(100, 100, 100)',
      body: 'Hello world',
    },
  ];

  it('returns null when nothing stored', () => {
    expect(loadStoredState()).toBeNull();
  });

  it('round-trips stored state', () => {
    saveStoredState(sampleTexts, 'frequency');
    const loaded = loadStoredState();
    expect(loaded).toEqual({
      texts: sampleTexts,
      mode: 'frequency',
    });
  });

  it('discards stored state on version mismatch', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: DIFFS_STATE_VERSION + 999,
        texts: sampleTexts,
        mode: 'chronologic',
      })
    );
    expect(loadStoredState()).toBeNull();
  });

  it('clears stored state', () => {
    saveStoredState(sampleTexts, 'alphabetic');
    clearStoredState();
    expect(loadStoredState()).toBeNull();
    expect(window.localStorage.getItem(STORAGE_KEY)).toBeNull();
  });
});
