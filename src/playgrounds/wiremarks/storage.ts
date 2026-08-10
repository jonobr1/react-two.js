import { Vector2D } from './types';

export const POSITIONS_KEY = 'wiremarks-positions';

/**
 * Bump when the meaning of a stored coordinate changes (a new layout origin,
 * a different unit scale). Mismatched payloads are discarded rather than
 * half-restored.
 */
export const POSITIONS_VERSION = 1;

export type PositionMap = Record<string, Vector2D>;

interface StoredPayload {
  version: number;
  positions: PositionMap;
}

function isVector(value: unknown): value is Vector2D {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const candidate = value as { x?: unknown; y?: unknown };
  return (
    typeof candidate.x === 'number' &&
    Number.isFinite(candidate.x) &&
    typeof candidate.y === 'number' &&
    Number.isFinite(candidate.y)
  );
}

/**
 * Read persisted node positions. Any problem — missing key, blocked storage,
 * malformed JSON, stale version — yields an empty map rather than throwing,
 * because a broken cache should never stop the graph from rendering.
 */
export function loadPositions(): PositionMap {
  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(POSITIONS_KEY);
  } catch {
    return {};
  }

  if (!raw) {
    return {};
  }

  let payload: StoredPayload;
  try {
    payload = JSON.parse(raw) as StoredPayload;
  } catch {
    return {};
  }

  if (
    typeof payload !== 'object' ||
    payload === null ||
    payload.version !== POSITIONS_VERSION ||
    typeof payload.positions !== 'object' ||
    payload.positions === null
  ) {
    return {};
  }

  const result: PositionMap = {};
  for (const [id, value] of Object.entries(payload.positions)) {
    if (isVector(value)) {
      result[id] = { x: value.x, y: value.y };
    }
  }
  return result;
}

/**
 * Persist node positions, keeping only ids still present in the graph so
 * deleted entity names cannot accumulate forever.
 */
export function savePositions(
  positions: PositionMap,
  validIds: Iterable<string>,
): void {
  const allowed = new Set(validIds);
  const pruned: PositionMap = {};

  for (const [id, value] of Object.entries(positions)) {
    if (allowed.has(id) && isVector(value)) {
      pruned[id] = { x: value.x, y: value.y };
    }
  }

  if (Object.keys(pruned).length === 0) {
    clearPositions();
    return;
  }

  const payload: StoredPayload = {
    version: POSITIONS_VERSION,
    positions: pruned,
  };

  try {
    window.localStorage.setItem(POSITIONS_KEY, JSON.stringify(payload));
  } catch {
    // Storage can be unavailable (Safari private mode, quota). Losing the
    // cache is acceptable; crashing the playground is not.
  }
}

export function clearPositions(): void {
  try {
    window.localStorage.removeItem(POSITIONS_KEY);
  } catch {
    // See savePositions.
  }
}
