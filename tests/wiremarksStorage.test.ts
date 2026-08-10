import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  POSITIONS_KEY,
  POSITIONS_VERSION,
  loadPositions,
  savePositions,
  clearPositions,
} from '../src/playgrounds/wiremarks/storage';

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('wiremarks position storage', () => {
  it('returns an empty map when nothing is stored', () => {
    expect(loadPositions()).toEqual({});
  });

  it('round-trips positions', () => {
    savePositions({ Processing: { x: 940, y: 610 } }, ['Processing']);

    expect(loadPositions()).toEqual({ Processing: { x: 940, y: 610 } });
  });

  it('prunes positions for nodes no longer in the graph', () => {
    savePositions(
      { Kept: { x: 1, y: 2 }, Removed: { x: 3, y: 4 } },
      ['Kept']
    );

    expect(loadPositions()).toEqual({ Kept: { x: 1, y: 2 } });
  });

  it('ignores a payload written by a different version', () => {
    window.localStorage.setItem(
      POSITIONS_KEY,
      JSON.stringify({
        version: POSITIONS_VERSION + 1,
        positions: { A: { x: 1, y: 2 } },
      })
    );

    expect(loadPositions()).toEqual({});
  });

  it('ignores malformed JSON', () => {
    window.localStorage.setItem(POSITIONS_KEY, '{not json');

    expect(loadPositions()).toEqual({});
  });

  it('ignores entries whose coordinates are not numbers', () => {
    window.localStorage.setItem(
      POSITIONS_KEY,
      JSON.stringify({
        version: POSITIONS_VERSION,
        positions: { Good: { x: 1, y: 2 }, Bad: { x: 'nope', y: 2 } },
      })
    );

    expect(loadPositions()).toEqual({ Good: { x: 1, y: 2 } });
  });

  it('clears stored positions', () => {
    savePositions({ A: { x: 1, y: 2 } }, ['A']);
    clearPositions();

    expect(loadPositions()).toEqual({});
    expect(window.localStorage.getItem(POSITIONS_KEY)).toBeNull();
  });

  it('does not throw when writing is blocked', () => {
    // Safari private mode throws on setItem once the quota is reached.
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new DOMException('QuotaExceededError');
    });

    expect(() => savePositions({ A: { x: 1, y: 2 } }, ['A'])).not.toThrow();
  });

  it('does not throw when reading is blocked', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new DOMException('SecurityError');
    });

    expect(() => loadPositions()).not.toThrow();
    expect(loadPositions()).toEqual({});
  });

  it('does not throw when clearing is blocked', () => {
    vi.spyOn(Storage.prototype, 'removeItem').mockImplementation(() => {
      throw new DOMException('SecurityError');
    });

    expect(() => clearPositions()).not.toThrow();
  });

  it('removes the entry entirely when nothing remains after pruning', () => {
    savePositions({ Gone: { x: 1, y: 2 } }, []);

    expect(window.localStorage.getItem(POSITIONS_KEY)).toBeNull();
  });
});
