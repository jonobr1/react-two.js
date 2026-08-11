import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useWiremarksGraph } from '../src/playgrounds/wiremarks/hooks/useWiremarksGraph';
import {
  POSITIONS_KEY,
  POSITIONS_VERSION,
  loadPositions,
} from '../src/playgrounds/wiremarks/storage';

const CHAIN = 'A -> B\nB -> C';

type HookResult = { current: ReturnType<typeof useWiremarksGraph> };

/** Ids are scoped internals; find nodes by the name the user typed. */
function node(result: HookResult, name: string) {
  return result.current.nodes.find((n) => n.name === name)!;
}

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

    expect(node(result, 'A').x).toBeLessThan(node(result, 'B').x);
    expect(node(result, 'B').x).toBeLessThan(node(result, 'C').x);
  });

  it('restores persisted positions on mount', () => {
    const probe = renderHook(() => useWiremarksGraph(CHAIN));
    const id = node(probe.result, 'B').id;
    probe.unmount();

    seedStorage({ [id]: { x: 1234, y: 5678 } });

    const { result } = renderHook(() => useWiremarksGraph(CHAIN));
    expect(node(result, 'B')).toMatchObject({ x: 1234, y: 5678 });
  });

  it('leaves nodes without a stored position to the layout', () => {
    const probe = renderHook(() => useWiremarksGraph(CHAIN));
    const id = node(probe.result, 'B').id;
    probe.unmount();

    seedStorage({ [id]: { x: 1234, y: 5678 } });

    const { result } = renderHook(() => useWiremarksGraph(CHAIN));
    expect(node(result, 'A').x).not.toBe(1234);
  });

  it('persists only dragged nodes when positions are committed', () => {
    const { result } = renderHook(() => useWiremarksGraph(CHAIN));
    const id = node(result, 'B').id;

    act(() => {
      result.current.updateNodePosition(id, 42, 84);
    });
    act(() => {
      result.current.commitPositions();
    });

    expect(loadPositions()).toEqual({ [id]: { x: 42, y: 84 } });
  });

  it('does not write to storage while a drag is in progress', () => {
    const { result } = renderHook(() => useWiremarksGraph(CHAIN));

    act(() => {
      result.current.updateNodePosition(node(result, 'B').id, 42, 84);
    });

    expect(loadPositions()).toEqual({});
  });

  it('pins dragged nodes when the text changes', () => {
    const { result, rerender } = renderHook(
      ({ text }) => useWiremarksGraph(text),
      { initialProps: { text: CHAIN } }
    );

    act(() => {
      result.current.updateNodePosition(node(result, 'C').id, 999, 111);
    });

    rerender({ text: `Zero -> A\n${CHAIN}` });

    expect(node(result, 'C')).toMatchObject({ x: 999, y: 111 });
  });

  it('reflows undragged nodes when the text changes', () => {
    const { result, rerender } = renderHook(
      ({ text }) => useWiremarksGraph(text),
      { initialProps: { text: CHAIN } }
    );

    const before = node(result, 'A').x;
    rerender({ text: `Zero -> A\n${CHAIN}` });

    expect(node(result, 'A').x).toBeGreaterThan(before);
  });

  it('drops stored positions for entities removed from the text', () => {
    const { result, rerender } = renderHook(
      ({ text }) => useWiremarksGraph(text),
      { initialProps: { text: CHAIN } }
    );

    const id = node(result, 'C').id;
    act(() => {
      result.current.updateNodePosition(id, 5, 5);
    });
    act(() => {
      result.current.commitPositions();
    });
    expect(loadPositions()).toHaveProperty(id);

    rerender({ text: 'A -> B' });
    act(() => {
      result.current.commitPositions();
    });

    expect(loadPositions()).not.toHaveProperty(id);
  });

  it('clears overrides and storage when the reset token changes', () => {
    const { result, rerender } = renderHook(
      ({ token }) => useWiremarksGraph(CHAIN, token),
      { initialProps: { token: 0 } }
    );

    const id = node(result, 'B').id;
    act(() => {
      result.current.updateNodePosition(id, 42, 84);
    });
    act(() => {
      result.current.commitPositions();
    });
    expect(loadPositions()).toEqual({ [id]: { x: 42, y: 84 } });

    rerender({ token: 1 });

    expect(loadPositions()).toEqual({});
    expect(node(result, 'B').x).not.toBe(42);
  });

  describe('blocks', () => {
    it('places every node of a later block below every node of an earlier one', () => {
      const { result } = renderHook(() =>
        useWiremarksGraph('A -> B\nB -> C\n---\nD -> E')
      );

      const first = ['A', 'B', 'C'].map((name) => node(result, name).y);
      const second = ['D', 'E'].map((name) => node(result, name).y);

      expect(Math.min(...second)).toBeGreaterThan(Math.max(...first));
    });

    it('gives repeated names across blocks distinct ids', () => {
      const { result } = renderHook(() =>
        useWiremarksGraph('A -> B\n---\nA -> C')
      );

      const [first, second] = result.current.nodes.filter(
        (n) => n.name === 'A'
      );
      expect(first.id).not.toBe(second.id);
    });

    it('drags one occurrence of a name without moving the other', () => {
      const { result } = renderHook(() =>
        useWiremarksGraph('A -> B\n---\nA -> C')
      );

      const [first, second] = result.current.nodes.filter(
        (n) => n.name === 'A'
      );
      const secondY = second.y;

      act(() => {
        result.current.updateNodePosition(first.id, 10, 20);
      });

      const after = result.current.nodes.filter((n) => n.name === 'A');
      expect(after[0]).toMatchObject({ x: 10, y: 20 });
      expect(after[1].y).toBe(secondY);
    });
  });
});
