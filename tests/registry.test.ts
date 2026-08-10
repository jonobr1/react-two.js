import { describe, it, expect } from 'vitest';
import { PLAYGROUNDS, getPlaygroundById } from '../src/playgrounds/registry';

describe('Playground Registry', () => {
  it('should export registered playgrounds list', () => {
    expect(PLAYGROUNDS.length).toBeGreaterThan(0);
    expect(PLAYGROUNDS.some((p) => p.id === 'wiremarks')).toBe(true);
  });

  it('should retrieve playground by ID or fallback to first playground', () => {
    const wiremarks = getPlaygroundById('wiremarks');
    expect(wiremarks).toBeDefined();
    expect(wiremarks.name).toBe('Wiremarks');

    const fallback = getPlaygroundById('non-existent');
    expect(fallback).toEqual(PLAYGROUNDS[0]);
  });
});
