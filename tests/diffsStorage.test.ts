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

describe('diffs stored state hardening', () => {
  it('falls back to a known sort mode when the stored one is unrecognised', () => {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        version: DIFFS_STATE_VERSION,
        texts: [],
        mode: 'not-a-real-mode',
      })
    );

    // buildModel drives sortLines, which has no default branch — an unknown
    // mode would sort to undefined and crash on .map().
    expect(loadStoredState()?.mode).toBe('chronologic');
  });

  it('does not log when writing is blocked', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });

    expect(() => saveStoredState([], 'chronologic')).not.toThrow();
    expect(error).not.toHaveBeenCalled();
  });

  it('does not log when clearing is blocked', () => {
    const error = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('SecurityError');
    });

    expect(() => clearStoredState()).not.toThrow();
    expect(error).not.toHaveBeenCalled();
  });
});
