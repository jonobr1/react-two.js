export const LEADING = 40;
export const SIZE = 17;
export const CHARACTER_WIDTH = 10;
export const COLUMN_PITCH = 250;
export const SHARED_COLUMN_X = 40;
export const COLUMN_START_Y = 100;
export const FONT_FAMILY = '"Inter", Helvetica, Arial, sans-serif';

/** Matches the `top-4` / `bottom-4` insets of the floating chrome. */
export const CHROME_INSET = 16;
/** Breathing room between the floating chrome and the text panes. */
export const CHROME_GAP = 12;

export const STORAGE_KEY = 'diffs-state-v1';
export const DIFFS_STATE_VERSION = 1;

/**
 * Two.js writes this through its baseline map as `dominant-baseline:
 * alphabetic`. The original app asked for `'top'`, but the two.js of the day
 * emitted that string verbatim — an invalid CSS value that browsers fall back
 * to `auto`, i.e. the alphabetic baseline. The `y` offsets in StatLine and Legend
 * were tuned against that fallback, so naming it explicitly keeps the original's optical
 * centring instead of two.js's `middle` default, which sits ~5.6px low.
 */
export const TEXT_BASELINE = 'baseline';
