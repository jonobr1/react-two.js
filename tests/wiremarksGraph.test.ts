import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWiremarksGraph } from '../src/playgrounds/wiremarks/hooks/useWiremarksGraph';
import {
  POSITIONS_KEY,
  POSITIONS_VERSION,
  loadPositions,
} from '../src/playgrounds/wiremarks/storage';

const CHAIN = 'A -> B\nB -> C';

function seedStorage(positions: Record<string, { x: number; y: number }>) {
  window.localStorage.setItem(
    POSITIONS_KEY,
    JSON.stringify({ version: POSITIONS_VERSION, positions })
  );
}

beforeEach(() => {
  window.localStorage.clear();
});

describe('useWiremarksGraph', () => {
  it('positions nodes with the layered layout', () => {
    const { result } = renderHook(() => useWiremarksGraph(CHAIN));

    const { nodesMap } = result.current;
    expect(nodesMap.get('A')!.x).toBeLessThan(nodesMap.get('B')!.x);
    expect(nodesMap.get('B')!.x).toBeLessThan(nodesMap.get('C')!.x);
  });

  it('restores persisted positions on mount', () => {
    seedStorage({ B: { x: 1234, y: 5678 } });

    const { result } = renderHook(() => useWiremarksGraph(CHAIN));

    expect(result.current.nodesMap.get('B')).toMatchObject({
      x: 1234,
      y: 5678,
    });
  });

  it('leaves nodes without a stored position to the layout', () => {
    seedStorage({ B: { x: 1234, y: 5678 } });

    const { result } = renderHook(() => useWiremarksGraph(CHAIN));

    expect(result.current.nodesMap.get('A')!.x).not.toBe(1234);
  });

  it('persists only dragged nodes when positions are committed', () => {
    const { result } = renderHook(() => useWiremarksGraph(CHAIN));

    act(() => {
      result.current.updateNodePosition('B', 42, 84);
    });
    act(() => {
      result.current.commitPositions();
    });

    expect(loadPositions()).toEqual({ B: { x: 42, y: 84 } });
  });

  it('does not write to storage while a drag is in progress', () => {
    const { result } = renderHook(() => useWiremarksGraph(CHAIN));

    act(() => {
      result.current.updateNodePosition('B', 42, 84);
    });

    expect(loadPositions()).toEqual({});
  });

  it('pins dragged nodes when the text changes', () => {
    const { result, rerender } = renderHook(
      ({ text }) => useWiremarksGraph(text),
      { initialProps: { text: CHAIN } }
    );

    act(() => {
      result.current.updateNodePosition('C', 999, 111);
    });

    // Introducing a new first entity shifts every rank along.
    rerender({ text: `Zero -> A\n${CHAIN}` });

    expect(result.current.nodesMap.get('C')).toMatchObject({
      x: 999,
      y: 111,
    });
  });

  it('reflows undragged nodes when the text changes', () => {
    const { result, rerender } = renderHook(
      ({ text }) => useWiremarksGraph(text),
      { initialProps: { text: CHAIN } }
    );

    const before = result.current.nodesMap.get('A')!.x;
    rerender({ text: `Zero -> A\n${CHAIN}` });
    const after = result.current.nodesMap.get('A')!.x;

    expect(after).toBeGreaterThan(before);
  });

  it('drops stored positions for entities removed from the text', () => {
    const { result, rerender } = renderHook(
      ({ text }) => useWiremarksGraph(text),
      { initialProps: { text: CHAIN } }
    );

    act(() => {
      result.current.updateNodePosition('C', 5, 5);
    });
    act(() => {
      result.current.commitPositions();
    });
    expect(loadPositions()).toHaveProperty('C');

    rerender({ text: 'A -> B' });
    act(() => {
      result.current.commitPositions();
    });

    expect(loadPositions()).not.toHaveProperty('C');
  });

  it('clears overrides and storage when the reset token changes', () => {
    const { result, rerender } = renderHook(
      ({ token }) => useWiremarksGraph(CHAIN, token),
      { initialProps: { token: 0 } }
    );

    act(() => {
      result.current.updateNodePosition('B', 42, 84);
    });
    act(() => {
      result.current.commitPositions();
    });
    expect(loadPositions()).toEqual({ B: { x: 42, y: 84 } });

    rerender({ token: 1 });

    expect(loadPositions()).toEqual({});
    expect(result.current.nodesMap.get('B')!.x).not.toBe(42);
  });
});
