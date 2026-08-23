import { DIFFS_STATE_VERSION, STORAGE_KEY } from './constants';
import { isSortMode, SortMode, TextDoc } from './types';

export interface StoredDiffsState {
  version: number;
  texts: TextDoc[];
  mode: SortMode;
}

export function generateColor(min = 0, max = 0.5): string {
  const h = Math.floor(Math.random() * 360);
  const s = 100;
  const l = Math.floor((Math.random() * (max - min) + min) * 100);

  // Convert HSL to RGB
  const c = (1 - Math.abs((2 * l) / 100 - 1)) * (s / 100);
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l / 100 - c / 2;

  let r = 0,
    g = 0,
    b = 0;
  if (0 <= h && h < 60) {
    r = c; g = x; b = 0;
  } else if (60 <= h && h < 120) {
    r = x; g = c; b = 0;
  } else if (120 <= h && h < 180) {
    r = 0; g = c; b = x;
  } else if (180 <= h && h < 240) {
    r = 0; g = x; b = c;
  } else if (240 <= h && h < 300) {
    r = x; g = 0; b = c;
  } else if (300 <= h && h < 360) {
    r = c; g = 0; b = x;
  }

  const red = Math.floor((r + m) * 255);
  const green = Math.floor((g + m) * 255);
  const blue = Math.floor((b + m) * 255);

  return `rgb(${red}, ${green}, ${blue})`;
}

export function loadStoredState(): { texts: TextDoc[]; mode: SortMode } | null {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: StoredDiffsState = JSON.parse(raw);
    if (parsed.version !== DIFFS_STATE_VERSION || !Array.isArray(parsed.texts)) {
      return null;
    }
    return {
      texts: parsed.texts,
      // `sortLines` switches on this with no default branch, so an unknown
      // mode would sort to undefined and crash the model build.
      mode: isSortMode(parsed.mode) ? parsed.mode : 'chronologic',
    };
  } catch {
    return null;
  }
}

export function saveStoredState(texts: TextDoc[], mode: SortMode): void {
  try {
    const payload: StoredDiffsState = {
      version: DIFFS_STATE_VERSION,
      texts,
      mode,
    };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // Safari private mode and quota limits throw here. Losing a save is not
    // worth spamming the console on every keystroke.
  }
}

export function clearStoredState(): void {
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage may be unavailable entirely; nothing to recover from.
  }
}
