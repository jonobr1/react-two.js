import { describe, it, expect } from 'vitest';
import {
  normalizeWheelDelta,
  wheelZoomDelta,
  pinchWheelZoomDelta,
  pinchZoomDelta,
  distance,
  centroid,
  clamp,
} from '../lib/zuiMath';

describe('normalizeWheelDelta', () => {
  it('passes pixel mode through unchanged', () => {
    expect(normalizeWheelDelta(100, 0, 800)).toBe(100);
  });

  it('scales line mode by 16px per line', () => {
    expect(normalizeWheelDelta(3, 1, 800)).toBe(48);
  });

  it('scales page mode by the viewport height', () => {
    expect(normalizeWheelDelta(1, 2, 800)).toBe(800);
  });
});

describe('wheelZoomDelta', () => {
  it('returns a negative log delta when scrolling down (zoom out)', () => {
    expect(wheelZoomDelta(100, 0, 0.05, 800)).toBeCloseTo(-0.05, 10);
  });

  it('returns a positive log delta when scrolling up (zoom in)', () => {
    expect(wheelZoomDelta(-100, 0, 0.05, 800)).toBeCloseTo(0.05, 10);
  });

  it('is symmetric so a scroll down then up is a round trip', () => {
    const down = wheelZoomDelta(100, 0, 0.05, 800);
    const up = wheelZoomDelta(-100, 0, 0.05, 800);
    expect(down + up).toBeCloseTo(0, 10);
  });
});

describe('pinchWheelZoomDelta', () => {
  it('inverts a ctrl-wheel trackpad pinch', () => {
    expect(pinchWheelZoomDelta(-10)).toBeCloseTo(0.1, 10);
  });
});

describe('pinchZoomDelta', () => {
  it('returns zero when the distance is unchanged', () => {
    expect(pinchZoomDelta(100, 100)).toBe(0);
  });

  it('returns a log ratio so doubling the spread is scale-independent', () => {
    expect(pinchZoomDelta(100, 200)).toBeCloseTo(Math.LN2, 10);
    expect(pinchZoomDelta(400, 800)).toBeCloseTo(Math.LN2, 10);
  });

  it('guards against zero and negative distances', () => {
    expect(pinchZoomDelta(0, 100)).toBe(0);
    expect(pinchZoomDelta(100, 0)).toBe(0);
  });
});

describe('distance and centroid', () => {
  it('computes euclidean distance', () => {
    expect(distance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(5);
  });

  it('computes the midpoint of two points', () => {
    expect(centroid([{ x: 0, y: 0 }, { x: 10, y: 20 }])).toEqual({ x: 5, y: 10 });
  });

  it('returns the origin for an empty list', () => {
    expect(centroid([])).toEqual({ x: 0, y: 0 });
  });
});

describe('clamp', () => {
  it('clamps to both bounds', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-1, 0, 10)).toBe(0);
    expect(clamp(11, 0, 10)).toBe(10);
  });
});
