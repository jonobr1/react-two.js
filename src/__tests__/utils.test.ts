import { describe, it, expect } from 'vitest';

// Simple utility function to test basic setup
function add(a: number, b: number): number {
  return a + b;
}

function multiply(a: number, b: number): number {
  return a * b;
}

describe('Utility Functions', () => {
  it('should add two numbers correctly', () => {
    expect(add(2, 3)).toBe(5);
    expect(add(-1, 1)).toBe(0);
    expect(add(0, 0)).toBe(0);
  });

  it('should multiply two numbers correctly', () => {
    expect(multiply(2, 3)).toBe(6);
    expect(multiply(-1, 1)).toBe(-1);
    expect(multiply(0, 5)).toBe(0);
  });

  it('should handle edge cases', () => {
    expect(add(0.1, 0.2)).toBeCloseTo(0.3);
    expect(multiply(1.5, 2)).toBe(3);
  });
});