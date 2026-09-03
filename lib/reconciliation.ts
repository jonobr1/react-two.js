import type { Shape } from 'two.js/src/shape';
import type { Group } from 'two.js/src/group';

/**
 * Standard default values for Two.js properties.
 * Used when a previously specified React prop is removed or set to undefined.
 */
export const TWO_DEFAULT_PROPS: Record<string, unknown> = {
  // Shape / Path styling
  fill: '#fff',
  stroke: '#000',
  linewidth: 1,
  opacity: 1,
  visible: true,
  cap: 'round',
  join: 'round',
  miter: 4,
  closed: true,
  curved: false,
  automatic: true,
  beginning: 0,
  ending: 1,
  dashes: [],

  // Positioning & transforms
  x: 0,
  y: 0,
  rotation: 0,
  scale: 1,
  skewX: 0,
  skewY: 0,

  // Masking & clipping
  mask: null,
  clip: false,
  strokeAttenuation: true,

  // General element
  className: '',

  // Points defaults
  sizeAttenuation: false,

  // Gradient defaults
  spread: 'pad',
  units: 'objectBoundingBox',

  // Text defaults
  value: '',
  family: 'sans-serif',
  size: 13,
  leading: 17,
  alignment: 'middle',
  baseline: 'middle',
  style: 'normal',
  weight: 'normal',
  decoration: 'none',
  direction: 'ltr',

  // Line endpoints
  x1: 0,
  y1: 0,
  x2: 0,
  y2: 0,

  // Circle / Rectangle dimensions
  radius: 0,
  width: 0,
  height: 0,

  // Special flags
  manual: false,
};

/**
 * Capture default property values present on a newly instantiated Two.js object.
 */
export function captureDefaultProps(
  instance: Record<string, unknown>
): Record<string, unknown> {
  const defaults: Record<string, unknown> = { ...TWO_DEFAULT_PROPS };

  for (const key of Object.keys(TWO_DEFAULT_PROPS)) {
    if (key in instance && instance[key] !== undefined) {
      defaults[key] = instance[key];
    }
  }

  // Also capture instance-specific properties if defined
  if ('translation' in instance && instance.translation) {
    const translation = instance.translation as { x?: number; y?: number };
    defaults.x = translation.x ?? 0;
    defaults.y = translation.y ?? 0;
  }

  return defaults;
}

/**
 * Result of diffing incoming props against previously applied props.
 */
export interface PropDiff<P> {
  changed: Partial<P>;
  removed: Array<keyof P>;
  hasChanges: boolean;
}

/**
 * Diffs incoming props against previously applied props.
 * - Properties with new/changed values are in `changed`.
 * - Properties present in `prevProps` but missing/undefined in `nextProps` are in `removed`.
 * - Unchanged properties are omitted.
 */
export function diffProps<P extends Record<string, unknown>>(
  prevProps: P,
  nextProps: P,
  ignoredKeys: Set<string> = new Set()
): PropDiff<P> {
  const changed: Partial<P> = {};
  const removed: Array<keyof P> = [];

  // Check for changed or newly added props
  for (const key in nextProps) {
    if (ignoredKeys.has(key)) continue;

    const nextVal = nextProps[key];
    const prevVal = prevProps[key];

    if (nextVal !== prevVal) {
      if (nextVal === undefined) {
        // Setting to undefined is treated as prop removal
        if (key in prevProps && prevVal !== undefined) {
          removed.push(key as keyof P);
        }
      } else {
        changed[key as keyof P] = nextVal;
      }
    }
  }

  // Check for removed props
  for (const key in prevProps) {
    if (ignoredKeys.has(key)) continue;

    if (!(key in nextProps) && prevProps[key] !== undefined) {
      if (!removed.includes(key as keyof P)) {
        removed.push(key as keyof P);
      }
    }
  }

  const hasChanges =
    Object.keys(changed).length > 0 || removed.length > 0;

  return { changed, removed, hasChanges };
}

/**
 * Helper to safely reorder children inside a Two.js parent Group
 * to match a given target order array.
 */
export function reconcileSceneOrder(
  parent: Group,
  targetOrder: Array<Shape | Group>
): void {
  if (!parent || !parent.children || targetOrder.length === 0) return;

  const children = parent.children as unknown as Array<Shape | Group>;
  if (children.length <= 1) return;

  // Build target position map
  const targetMap = new Map<Shape | Group, number>();
  targetOrder.forEach((item, idx) => {
    targetMap.set(item, idx);
  });

  let needsReorder = false;
  let lastSeenIndex = -1;

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const targetIdx = targetMap.get(child);
    if (targetIdx !== undefined) {
      if (targetIdx < lastSeenIndex) {
        needsReorder = true;
        break;
      }
      lastSeenIndex = targetIdx;
    }
  }

  if (!needsReorder) return;

  // Stable sort children array according to targetMap
  children.sort((a, b) => {
    const indexA = targetMap.get(a);
    const indexB = targetMap.get(b);

    if (indexA !== undefined && indexB !== undefined) {
      return indexA - indexB;
    }
    if (indexA !== undefined) return -1;
    if (indexB !== undefined) return 1;
    return 0;
  });

  // Flag Two.js order update so renderer knows the scenegraph order changed
  if (typeof (parent as unknown as { _flagOrder?: boolean })._flagOrder !== 'undefined') {
    (parent as unknown as { _flagOrder: boolean })._flagOrder = true;
  }
}
