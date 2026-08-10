import { describe, it, expect, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import Two from 'two.js';
import { Canvas } from '../lib/main';
import { WiremarkEntity } from '../src/playgrounds/wiremarks/components/WiremarkEntity';
import type { WiremarkNode } from '../src/playgrounds/wiremarks/types';

const node: WiremarkNode = {
  id: 'a',
  name: 'A',
  x: 400,
  y: 300,
  width: 120,
  height: 60,
  colors: { fill: '#fff', stroke: '#000', textColor: '#000' },
};

function pointer(type: string, init: Partial<PointerEventInit> = {}) {
  return new PointerEvent(type, {
    bubbles: true,
    cancelable: true,
    pointerId: 1,
    isPrimary: true,
    button: 0,
    buttons: type === 'pointerup' ? 0 : 1,
    ...init,
  });
}

function renderEntity(handlers: {
  onDragStart?: (id: string, x: number, y: number) => void;
  onDrag?: (id: string, x: number, y: number) => void;
  onDragEnd?: (id: string) => void;
}) {
  const result = render(
    <Canvas type={Two.Types.canvas} width={800} height={600}>
      <WiremarkEntity node={node} {...handlers} />
    </Canvas>
  );
  const canvas = document.querySelector('canvas')!;
  return { ...result, canvas };
}

describe('WiremarkEntity drag lifecycle', () => {
  it('reports drag movement while mounted', () => {
    const onDrag = vi.fn();
    const { canvas } = renderEntity({ onDrag });

    act(() => {
      canvas.dispatchEvent(pointer('pointerdown', { clientX: 400, clientY: 300 }));
      window.dispatchEvent(pointer('pointermove', { clientX: 420, clientY: 310 }));
    });

    expect(onDrag).toHaveBeenCalledWith('a', 420, 310);
  });

  it('detaches window listeners when the node unmounts mid-drag', () => {
    const onDrag = vi.fn();
    const onDragEnd = vi.fn();
    const { canvas, unmount } = renderEntity({ onDrag, onDragEnd });

    act(() => {
      canvas.dispatchEvent(pointer('pointerdown', { clientX: 400, clientY: 300 }));
      window.dispatchEvent(pointer('pointermove', { clientX: 420, clientY: 310 }));
    });
    expect(onDrag).toHaveBeenCalledTimes(1);

    // The DSL text can change (or the graph can re-parse) mid-drag, which
    // unmounts the entity before pointerup ever arrives.
    act(() => {
      unmount();
    });

    // The parent must be told the drag is over, or draggingNodeId stays stale.
    expect(onDragEnd).toHaveBeenCalledWith('a');

    act(() => {
      window.dispatchEvent(pointer('pointermove', { clientX: 500, clientY: 400 }));
    });

    // Still 1: no further callbacks from an unmounted component.
    expect(onDrag).toHaveBeenCalledTimes(1);
  });

  it('detaches window listeners after a normal pointerup', () => {
    const onDrag = vi.fn();
    const onDragEnd = vi.fn();
    const { canvas } = renderEntity({ onDrag, onDragEnd });

    act(() => {
      canvas.dispatchEvent(pointer('pointerdown', { clientX: 400, clientY: 300 }));
      window.dispatchEvent(pointer('pointerup', { clientX: 400, clientY: 300 }));
    });
    expect(onDragEnd).toHaveBeenCalledWith('a');

    act(() => {
      window.dispatchEvent(pointer('pointermove', { clientX: 500, clientY: 400 }));
    });
    expect(onDrag).not.toHaveBeenCalled();
  });
});
