import { createRef, memo } from 'react';
import { fireEvent, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Two from 'two.js';
import { Canvas, Circle, Group, Rectangle, type TwoEvent } from '../lib/main';

const rect = { left: 10, top: 20, right: 410, bottom: 320, width: 400, height: 300, x: 10, y: 20, toJSON: () => ({}) };
function renderer(container: HTMLElement) {
  const element = container.querySelector('svg,canvas')!;
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue(rect);
  return element;
}
const inside = { clientX: 110, clientY: 95, pointerId: 1, button: 0 };
const outside = { clientX: 390, clientY: 290, pointerId: 1, button: 0 };
afterEach(() => vi.restoreAllMocks());

// CSS renders 800x600 logical pixels in a 400x300 rectangle with a nonzero offset.
describe.each(['SVGRenderer', 'CanvasRenderer'] as const)('%s event semantics', (type) => {
  it('reports identical world coordinates and bubbles through noninteractive intermediate parents', () => {
    const shape = createRef<Two.Circle>();
    const group = createRef<Two.Group>();
    const onShape = vi.fn();
    const onGroup = vi.fn();
    const { container } = render(<Canvas type={type} width={800} height={600}>
      <Group ref={group} onClick={onGroup} onPointerDown={onGroup} onWheel={onGroup}>
        <Group><Circle ref={shape} x={200} y={150} radius={40} onClick={onShape} onPointerDown={onShape} onWheel={onShape} /></Group>
      </Group>
    </Canvas>);
    const element = renderer(container);
    fireEvent.click(element, inside);
    fireEvent.pointerDown(element, inside);
    fireEvent.wheel(element, { ...inside, deltaY: 5 });
    expect(onShape).toHaveBeenCalledTimes(3);
    expect(onGroup).toHaveBeenCalledTimes(3);
    for (const [event] of onShape.mock.calls) {
      expect(event.point).toEqual({ x: 200, y: 150 });
      expect(event.target).toBe(shape.current);
      expect(event.currentTarget).toBe(shape.current);
    }
    for (const [event] of onGroup.mock.calls) {
      expect(event.point).toEqual({ x: 200, y: 150 });
      expect(event.target).toBe(shape.current);
      expect(event.currentTarget).toBe(group.current);
    }
  });

  it('uses current nested scene order across memoized parent reorders', () => {
    const left = vi.fn();
    const right = vi.fn();
    const Layer = memo(({ onClick }: { onClick: () => void }) => (
      <Group><Group><Circle x={200} y={150} radius={40} onClick={onClick} /></Group></Group>
    ));
    const view = (reverse: boolean) => <Canvas type={type} width={800} height={600}>
      {reverse ? [<Layer key="right" onClick={right} />, <Layer key="left" onClick={left} />]
        : [<Layer key="left" onClick={left} />, <Layer key="right" onClick={right} />]}
    </Canvas>;
    const { container, rerender } = render(view(false));
    const element = renderer(container);
    fireEvent.click(element, inside);
    expect(right).toHaveBeenCalledTimes(1);
    expect(left).not.toHaveBeenCalled();
    rerender(view(true));
    fireEvent.click(element, inside);
    expect(left).toHaveBeenCalledTimes(1);
    expect(right).toHaveBeenCalledTimes(1);
  });

  it('targets actual child geometry for sparse groups and ignores transparent, invisible, and clipped content', () => {
    const onClick = vi.fn();
    const leaf = createRef<Two.Circle>();
    const { container } = render(<Canvas type={type} width={800} height={600}>
      <Group onClick={onClick}>
        <Circle ref={leaf} x={100} y={150} radius={10} />
        <Group><Circle x={300} y={150} radius={10} /></Group>
        <Circle x={200} y={150} radius={10} opacity={0} />
        <Group visible={false}><Circle x={200} y={150} radius={20} /></Group>
        <Circle x={200} y={150} radius={30} fill="transparent" stroke="none" />
        <Circle x={200} y={150} radius={30} clip />
      </Group>
    </Canvas>);
    const element = renderer(container);
    fireEvent.click(element, inside); // Empty space in the group's aggregate bounds.
    expect(onClick).not.toHaveBeenCalled();
    fireEvent.click(element, { clientX: 60, clientY: 95 });
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0][0].target).toBe(leaf.current);
  });

  it('clips hit geometry to transformed owner masks and excludes the mask itself', () => {
    const onClick = vi.fn();
    const mask = new Two.Circle(0, 0, 20);
    const { container } = render(<Canvas type={type} width={800} height={600}>
      <Group x={200} y={150} mask={mask} onClick={onClick}>
        <Rectangle width={200} height={200} />
      </Group>
    </Canvas>);
    const element = renderer(container);
    fireEvent.click(element, inside);
    expect(onClick).toHaveBeenCalledTimes(1);
    fireEvent.click(element, { clientX: 135, clientY: 95 }); // Inside rectangle, outside mask.
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('stops bubbling and emits each hover transition once with the real leaf target', () => {
    const onParentClick = vi.fn();
    const onEnter = vi.fn();
    const onOver = vi.fn();
    const onLeave = vi.fn();
    const shape = createRef<Two.Circle>();
    const { container } = render(<Canvas type={type} width={800} height={600}>
      <Group onClick={onParentClick} onPointerEnter={onEnter} onPointerOver={onOver} onPointerLeave={onLeave}>
        <Circle ref={shape} x={200} y={150} radius={40} onClick={(event) => event.stopPropagation()} onPointerOver={() => {}} />
      </Group>
    </Canvas>);
    const element = renderer(container);
    fireEvent.click(element, inside);
    expect(onParentClick).not.toHaveBeenCalled();
    fireEvent.pointerMove(element, inside);
    fireEvent.pointerMove(element, inside);
    expect(onEnter).toHaveBeenCalledTimes(1);
    expect(onOver).toHaveBeenCalledTimes(1);
    expect(onEnter.mock.calls[0][0].target).toBe(shape.current);
    fireEvent.pointerMove(element, outside);
    expect(onLeave).toHaveBeenCalledTimes(1);
    expect(onLeave.mock.calls[0][0].target).toBe(shape.current);
  });

  it('fires missed only for complete empty primary presses, excluding hits, orphan ups, clicks, and cancels', () => {
    const onMissed = vi.fn();
    const { container } = render(<Canvas type={type} width={800} height={600} onPointerMissed={onMissed}>
      <Circle x={200} y={150} radius={40} onClick={() => {}} />
    </Canvas>);
    const element = renderer(container);
    fireEvent.pointerUp(element, outside);
    fireEvent.pointerDown(element, outside);
    fireEvent.pointerUp(window, outside); // A release outside ends the press.
    fireEvent.pointerUp(element, outside);
    fireEvent.click(element, outside);
    fireEvent.pointerDown(element, inside);
    fireEvent.pointerUp(element, outside);
    fireEvent.pointerDown(element, outside);
    fireEvent.pointerUp(element, inside);
    fireEvent.pointerDown(element, outside);
    fireEvent.pointerCancel(element, outside);
    fireEvent.pointerUp(element, outside);
    fireEvent.pointerDown(element, { ...outside, button: 2 });
    fireEvent.pointerUp(element, { ...outside, button: 2 });
    expect(onMissed).not.toHaveBeenCalled();
    fireEvent.pointerDown(element, outside);
    fireEvent.pointerUp(element, outside);
    fireEvent.click(element, outside);
    expect(onMissed).toHaveBeenCalledTimes(1);
    expect(onMissed.mock.calls[0][0].type).toBe('pointerup');
  });

  it('captures moves, ups, and cancels per pointer with bubbling and consistent payloads', () => {
    const moves = vi.fn();
    const ups = vi.fn();
    const cancels = vi.fn();
    const parentMoves = vi.fn();
    const missed = vi.fn();
    const captured: TwoEvent[] = [];
    const onDown = (event: TwoEvent) => {
      const id = (event.nativeEvent as PointerEvent).pointerId;
      event.setPointerCapture(id);
      expect(event.hasPointerCapture(id)).toBe(true);
      captured.push(event);
    };
    const { container } = render(<Canvas type={type} width={800} height={600} onPointerMissed={missed}>
      <Group onPointerMove={parentMoves}><Circle x={200} y={150} radius={40} onPointerDown={onDown}
        onPointerMove={moves} onPointerUp={ups} onPointerCancel={cancels} /></Group>
    </Canvas>);
    const element = renderer(container);
    fireEvent.pointerDown(element, inside);
    fireEvent.pointerDown(element, { ...inside, pointerId: 2 });
    fireEvent.pointerMove(element, { ...outside, pointerId: 3 });
    expect(moves).not.toHaveBeenCalled();
    fireEvent.pointerMove(element, outside);
    expect(moves).toHaveBeenCalledTimes(1);
    expect(parentMoves).toHaveBeenCalledTimes(1);
    expect(moves.mock.calls[0][0].point).toEqual({ x: 760, y: 540 });
    fireEvent.pointerUp(element, outside);
    expect(ups).toHaveBeenCalledTimes(1);
    expect(captured[0].hasPointerCapture(1)).toBe(false);
    expect(captured[1].hasPointerCapture(2)).toBe(true);
    fireEvent.pointerCancel(element, { ...outside, pointerId: 2 });
    expect(cancels).toHaveBeenCalledTimes(1);
    expect(captured[1].hasPointerCapture(2)).toBe(false);
    fireEvent.pointerMove(element, outside);
    expect(moves).toHaveBeenCalledTimes(1);
    expect(missed).not.toHaveBeenCalled();
  });

  it('retains capture through callback rerenders and releases it when the last handler is removed', () => {
    const first = vi.fn();
    const latest = vi.fn();
    const down = (event: TwoEvent) => event.setPointerCapture(1);
    const view = (move: typeof first, enabled = true) => <Canvas type={type} width={800} height={600}>
      <Circle x={200} y={150} radius={40} onPointerDown={enabled ? down : undefined} onPointerMove={enabled ? move : undefined} />
    </Canvas>;
    const { container, rerender } = render(view(first));
    const element = renderer(container);
    const setCapture = vi.fn();
    const releaseCapture = vi.fn();
    Object.defineProperties(element, {
      setPointerCapture: { value: setCapture },
      hasPointerCapture: { value: () => true },
      releasePointerCapture: { value: releaseCapture },
    });
    fireEvent.pointerDown(element, inside);
    rerender(view(latest));
    fireEvent.pointerMove(element, outside);
    expect(first).not.toHaveBeenCalled();
    expect(latest).toHaveBeenCalledTimes(1);
    expect(releaseCapture).not.toHaveBeenCalled();
    rerender(view(latest, false));
    expect(releaseCapture).toHaveBeenCalledWith(1);
    fireEvent.pointerMove(element, outside);
    expect(latest).toHaveBeenCalledTimes(1);
  });

  it('supports explicit capture release and lost capture without routing later moves', () => {
    const moves = vi.fn();
    let down!: TwoEvent;
    const { container } = render(<Canvas type={type} width={800} height={600}>
      <Circle x={200} y={150} radius={40} onPointerDown={(event) => { down = event; event.setPointerCapture(1); }} onPointerMove={moves} />
    </Canvas>);
    const element = renderer(container);
    fireEvent.pointerDown(element, inside);
    down.releasePointerCapture(1);
    fireEvent.pointerMove(element, outside);
    expect(moves).not.toHaveBeenCalled();
    fireEvent.pointerDown(element, inside);
    fireEvent(element, new PointerEvent('lostpointercapture', outside));
    expect(down.hasPointerCapture(1)).toBe(false);
    fireEvent.pointerMove(element, outside);
    expect(moves).not.toHaveBeenCalled();
  });
});

describe('SVG viewport coordinates', () => {
  it('uses the SVG screen transform rather than assuming CSS viewport size scales artwork', () => {
    const onClick = vi.fn();
    const { container } = render(<Canvas type="svg" width={800} height={600} viewBox="0 0 800 600">
      <Circle x={200} y={150} radius={40} onClick={onClick} />
    </Canvas>);
    const element = renderer(container);
    expect(element.getAttribute('viewBox')).toBe('0 0 800 600');
    // An unscaled viewport, or aspect-ratio letterboxing, has a different CTM
    // from the dimensions ratio. jsdom needs that native matrix supplied.
    Object.defineProperty(element, 'getScreenCTM', { value: () => ({
      inverse: () => ({ a: 1, b: 0, c: 0, d: 1, e: -10, f: -20 }),
    }) });
    fireEvent.click(element, { clientX: 210, clientY: 170 });
    expect(onClick).toHaveBeenCalledTimes(1);
    expect(onClick.mock.calls[0][0].point).toEqual({ x: 200, y: 150 });
  });
});
