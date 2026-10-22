import React, { createRef, memo, useState } from 'react';
import { act, render } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Two from 'two.js';
import { Canvas, Circle, Group, LinearGradient, RadialGradient, Rectangle, Stop, useTwo, type RefStop } from '../lib/main';

const settle = () => act(async () => { await Promise.resolve(); });

for (const Gradient of [LinearGradient, RadialGradient]) {
  describe(Gradient === LinearGradient ? 'LinearGradient composition' : 'RadialGradient composition', () => {
    it('binds fill and stroke, forwards stops, updates and resets stop props', () => {
      const ref = createRef<RefStop>();
      const shape = createRef<Two.Circle>();
      const second = createRef<Two.Rectangle>();
      const draw = (custom: boolean) => <Canvas><Gradient>{gradient => <>
        <Stop ref={ref} {...(custom ? { offset: 0.3, color: 'red', opacity: 0.4 } : {})} />
        <Circle ref={shape} radius={10} fill={gradient} />
        <Rectangle ref={second} width={20} height={20} stroke={gradient} />
      </>}</Gradient></Canvas>;
      const view = render(draw(true));
      const gradient = shape.current!.fill as Two.LinearGradient;
      expect(gradient.stops).toEqual([ref.current]);
      expect(second.current!.stroke).toBe(gradient);
      expect([ref.current!.offset, ref.current!.color, ref.current!.opacity]).toEqual([0.3, 'red', 0.4]);
      view.rerender(draw(false));
      expect(shape.current!.fill).toBe(gradient);
      expect([ref.current!.offset, ref.current!.color, ref.current!.opacity]).toEqual([0, '#fff', 1]);
    });

    it('reorders keyed memo stops across fragments and removes/adds stops', () => {
      const ref = createRef<Two.LinearGradient & Two.RadialGradient>();
      const Item = memo(({ color }: { color: string }) => <Stop color={color} />);
      const draw = (colors: string[]) => <Canvas><Gradient ref={ref}>
        <>{colors.map(color => <Item key={color} color={color} />)}</>
      </Gradient></Canvas>;
      const view = render(draw(['red', 'blue', 'green']));
      const blue = ref.current!.stops[1];
      view.rerender(draw(['green', 'blue', 'red']));
      expect(ref.current!.stops.map(s => s.color)).toEqual(['green', 'blue', 'red']);
      expect(ref.current!.stops[1]).toBe(blue);
      view.rerender(draw(['blue', 'yellow']));
      expect(ref.current!.stops.map(s => s.color)).toEqual(['blue', 'yellow']);
    });

    it('handles locally updated children without rerendering the resource', () => {
      const ref = createRef<Two.LinearGradient & Two.RadialGradient>();
      let toggle!: () => void;
      function Stops() {
        const [visible, set] = useState(true);
        toggle = () => set(v => !v);
        return <><Stop color="red" />{visible && <Stop color="blue" />}</>;
      }
      render(<Canvas><Gradient ref={ref}><Stops /></Gradient></Canvas>);
      expect(ref.current!.stops.length).toBe(2);
      act(() => toggle());
      expect(ref.current!.stops.map(s => s.color)).toEqual(['red']);
      act(() => toggle());
      expect(ref.current!.stops.map(s => s.color)).toEqual(['red', 'blue']);
    });

    it('preserves borrowed array stops and replaces/removes the array', async () => {
      const ref = createRef<Two.LinearGradient & Two.RadialGradient>();
      const borrowed = new Two.Stop(0, 'red');
      const listener = vi.fn();
      borrowed.bind('change', listener);
      const draw = (stops?: Two.Stop[]) => <Canvas><Gradient ref={ref} stops={stops}>
        <Stop color="blue" />
      </Gradient></Canvas>;
      const view = render(draw([borrowed]));
      expect(ref.current!.stops.map(s => s.color)).toEqual(['red', 'blue']);
      view.rerender(draw([new Two.Stop(1, 'green')]));
      expect(ref.current!.stops.map(s => s.color)).toEqual(['green', 'blue']);
      view.rerender(draw());
      expect(ref.current!.stops.map(s => s.color)).toEqual(['blue']);
      view.unmount(); await settle();
      borrowed.trigger('change');
      expect(listener).toHaveBeenCalledOnce();
    });
  });
}

it('retains shared stops after owner unmount and disposes after last consumer releases', async () => {
  let gradient!: Two.LinearGradient;
  const shape = createRef<Two.Circle>();
  function App({ owner, use }: { owner: boolean; use: boolean }) {
    return <Canvas>
      {owner && <LinearGradient>{g => { gradient = g; return <><Stop color="red" /><Stop color="blue" /></>; }}</LinearGradient>}
      <Circle ref={shape} radius={10} fill={use ? gradient : 'black'} />
    </Canvas>;
  }
  const view = render(<App owner use={false} />);
  view.rerender(<App owner use />);
  const dispose = vi.spyOn(gradient, 'dispose');
  view.rerender(<App owner={false} use />);
  await settle();
  expect(gradient.stops.map(s => s.color)).toEqual(['red', 'blue']);
  expect(dispose).not.toHaveBeenCalled();
  view.rerender(<App owner={false} use={false} />);
  await settle();
  expect(dispose).toHaveBeenCalledOnce();
  expect(gradient.stops).toHaveLength(0);
});

it('survives Strict Mode replay and cleans SVG definitions on unmount', async () => {
  const ref = createRef<Two.LinearGradient>();
  let two!: Two;
  function Probe() { two = useTwo().two!; return null; }
  const view = render(<React.StrictMode><Canvas type="svg"><LinearGradient ref={ref}>
    {gradient => <><Stop color="red" /><Stop color="blue" offset={1} />
      <Group fill={gradient}><Circle radius={20} /></Group></>}
  </LinearGradient><Probe /></Canvas></React.StrictMode>);
  await settle();
  const gradient = ref.current!;
  expect(gradient.stops).toHaveLength(2);
  act(() => { two.update(); });
  const definition = two.renderer.domElement.querySelector('linearGradient');
  expect(definition).not.toBeNull();
  expect(definition!.children).toHaveLength(2);
  const dispose = vi.spyOn(gradient, 'dispose');
  view.unmount(); await settle();
  expect(dispose).toHaveBeenCalledOnce();
  expect(definition!.parentNode).toBeNull();
});

it('updates actual SVG stop order for equal-length reorder and replacement', () => {
  let two!: Two;
  function Probe() { two = useTwo().two!; return null; }
  const draw = (colors: string[]) => <Canvas type="svg"><LinearGradient>
    {gradient => <>{colors.map((color, i) => <Stop key={color} color={color} offset={i} />)}
      <Circle radius={10} fill={gradient} /></>}
  </LinearGradient><Probe /></Canvas>;
  const view = render(draw(['red', 'blue']));
  const colors = () => {
    act(() => { two.update(); });
    return [...two.renderer.domElement.querySelectorAll('stop')].map(s => s.getAttribute('stop-color'));
  };
  expect(colors()).toEqual(['red', 'blue']);
  view.rerender(draw(['blue', 'red']));
  expect(colors()).toEqual(['blue', 'red']);
  view.rerender(draw(['green', 'yellow']));
  expect(colors()).toEqual(['green', 'yellow']);
});

it('replaces a resource without replacing the shape and retains it until both paint consumers release', async () => {
  let current!: Two.LinearGradient;
  const shape = createRef<Two.Circle>();
  const other = createRef<Two.Rectangle>();
  function App({ resourceKey, owner, fill, stroke }: { resourceKey: string; owner: boolean; fill: boolean; stroke: boolean }) {
    return <Canvas>
      {owner && <LinearGradient key={resourceKey}>{gradient => { current = gradient; return <Stop color="red" />; }}</LinearGradient>}
      <Circle ref={shape} radius={10} fill={fill ? current : 'black'} />
      <Rectangle ref={other} width={20} height={20} stroke={stroke ? current : 'black'} />
    </Canvas>;
  }
  const view = render(<App resourceKey="a" owner fill={false} stroke={false} />);
  const old = current;
  const disposeOld = vi.spyOn(old, 'dispose');
  view.rerender(<App resourceKey="a" owner fill stroke />);
  const circle = shape.current;
  // On replacement, bind the new resource using its render-function API; this
  // external-consumer case intentionally updates refs on the following render.
  view.rerender(<App resourceKey="b" owner fill stroke />);
  const next = current;
  expect(next).not.toBe(old);
  view.rerender(<App resourceKey="b" owner fill stroke />);
  await settle();
  expect(shape.current).toBe(circle);
  expect(shape.current!.fill).toBe(next);
  expect(disposeOld).toHaveBeenCalledOnce();
  const disposeNext = vi.spyOn(next, 'dispose');
  view.rerender(<App resourceKey="b" owner={false} fill stroke />);
  await settle();
  expect(disposeNext).not.toHaveBeenCalled();
  view.rerender(<App resourceKey="b" owner={false} fill={false} stroke />);
  await settle();
  expect(disposeNext).not.toHaveBeenCalled();
  view.rerender(<App resourceKey="b" owner={false} fill={false} stroke={false} />);
  await settle();
  expect(disposeNext).toHaveBeenCalledOnce();
});

it('observes local keyed reorders even when all Stop children are memoized', async () => {
  const ref = createRef<Two.LinearGradient>();
  let reverse!: () => void;
  const MemoStop = memo(Stop);
  function Stops() {
    const [colors, set] = useState(['red', 'blue']);
    reverse = () => set(c => [...c].reverse());
    return <>{colors.map(color => <MemoStop key={color} color={color} />)}</>;
  }
  render(<Canvas><LinearGradient ref={ref}><Stops /></LinearGradient></Canvas>);
  expect(ref.current!.stops.map(s => s.color)).toEqual(['red', 'blue']);
  act(() => reverse());
  await settle();
  expect(ref.current!.stops.map(s => s.color)).toEqual(['blue', 'red']);
});
