import { describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render } from '@testing-library/react';
import Two from 'two.js';
import { Canvas, useTwo } from 'react-two.js';
import { StatLine } from '../src/playgrounds/diffs/components/StatLine';
import { StatLineDatum } from '../src/playgrounds/diffs/types';

const datum: StatLineDatum = {
  key: 't1:fox',
  word: 'fox',
  stem: 'fox',
  count: 3,
  // World space has a top-left origin, so these are also the client
  // coordinates the line occupies.
  x: 200,
  y: 150,
  width: 50,
  visible: true,
};

type HitTest = (clientX: number, clientY: number) => boolean;

interface Sink {
  current: HitTest | null;
  two: Two | null;
}

function Probe({ sink }: { sink: Sink }) {
  const { hitTestPoint, two } = useTwo();
  sink.current = hitTestPoint;
  sink.two = two;
  return null;
}

function renderStatLine(highlightMode: boolean) {
  const onSelect = vi.fn();
  const sink: Sink = { current: null, two: null };

  const { container } = render(
    <Canvas type={Two.Types.svg} width={800} height={600} autostart={false}>
      <StatLine
        datum={datum}
        color="rgb(255, 0, 0)"
        isHighlighted={false}
        highlightMode={highlightMode}
        onSelect={onSelect}
      />
      <Probe sink={sink} />
    </Canvas>
  );

  const svg = container.querySelector('svg') as SVGElement;
  vi.spyOn(svg, 'getBoundingClientRect').mockReturnValue({
    left: 0,
    top: 0,
    right: 800,
    bottom: 600,
    width: 800,
    height: 600,
    x: 0,
    y: 0,
    toJSON: () => {},
  } as DOMRect);

  // Draw one frame so the scene graph and its bounds are current.
  act(() => {
    sink.two?.update();
  });

  return { container, svg, onSelect, sink };
}

/** A real click fires pointerdown, pointerup and click — in that order. */
function clickAt(target: Element, clientX: number, clientY: number) {
  act(() => {
    fireEvent.pointerDown(target, { clientX, clientY });
    fireEvent.pointerUp(target, { clientX, clientY });
    fireEvent.click(target, { clientX, clientY });
  });
}

describe('StatLine', () => {
  it('renders the word and its tally', () => {
    const { container } = renderStatLine(false);
    const words = Array.from(container.querySelectorAll('svg text')).map(
      (node) => node.textContent
    );

    expect(words).toContain('fox');
    expect(words).toContain('3');
  });

  it('emits its stem exactly once per click in highlight mode', () => {
    const { svg, onSelect } = renderStatLine(true);

    clickAt(svg, 200, 150);

    expect(onSelect).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith('fox');
  });

  it('does not emit when highlight mode is off', () => {
    const { svg, onSelect } = renderStatLine(false);

    clickAt(svg, 200, 150);

    expect(onSelect).not.toHaveBeenCalled();
  });

  it('only claims pointer hits in highlight mode, so panning stays free', () => {
    const off = renderStatLine(false);
    expect(off.sink.current?.(200, 150)).toBe(false);

    const on = renderStatLine(true);
    expect(on.sink.current?.(200, 150)).toBe(true);
  });
});

describe('StatLine vertical alignment', () => {
  it('sits on the alphabetic baseline, as the original does', () => {
    const { container } = renderStatLine(false);
    const texts = [...container.querySelectorAll('svg text')];

    expect(texts).toHaveLength(2);
    for (const node of texts) {
      expect(node.getAttribute('dominant-baseline')).toBe('alphabetic');
    }
  });
});
