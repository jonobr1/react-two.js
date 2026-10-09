import { createRef, StrictMode } from 'react';
import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Two from 'two.js';
import { Canvas, Circle, SVG, useTwo } from '../lib/main';

const artwork = '<svg xmlns="http://www.w3.org/2000/svg"><g id="nested"><circle cx="20" cy="20" r="10" fill="red" /></g></svg>';
let instance: Two | null;
function Probe() { instance = useTwo().two; return null; }
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: Error) => void;
  const promise = new Promise<T>((yes, no) => { resolve = yes; reject = no; });
  return { promise, resolve, reject };
}
const response = (markup = artwork) => ({ ok: true, text: async () => markup }) as Response;

// Tests retain real Two.js interpretation and control only the network boundary.
describe('SVG loading lifecycle', () => {
  it('supports shallow imports, cascading styles, transforms, and source replacement without removing JSX children', () => {
    const svg = createRef<Two.Group>();
    const child = createRef<Two.Circle>();
    const onLoad = vi.fn();
    const view = (shallow: boolean, content = artwork) => (
      <Canvas><SVG ref={svg} content={content} shallow={shallow} fill="blue" x={30} scale={2} onLoad={onLoad}>
        <Circle ref={child} radius={3} />
      </SVG></Canvas>
    );
    const { rerender } = render(view(false));
    const wrapper = svg.current!;
    const jsx = child.current;
    expect(wrapper.children).toHaveLength(2);
    expect(wrapper.children[0]).toBeInstanceOf(Two.Group);
    expect((wrapper.children[0] as Two.Group).children[0].id).toBe('nested');
    expect(wrapper.translation.x).toBe(30);
    expect(wrapper.scale).toBe(2);
    expect(wrapper.fill).toBe('blue');
    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(onLoad.mock.calls[0][0]).toBe(wrapper);
    const imported = wrapper.children[0];
    const unbind = vi.spyOn(imported, 'unbind');
    rerender(view(true));
    expect(wrapper.children[0].id).toBe('nested');
    expect(wrapper.children[1]).toBe(jsx);
    expect(unbind).toHaveBeenCalled();
    expect(onLoad).toHaveBeenCalledTimes(2);
    rerender(view(true, '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="20" /></svg>'));
    expect(wrapper.children[0]).toBeInstanceOf(Two.Rectangle);
    expect(wrapper.children[1]).toBe(jsx);
    expect(wrapper.children).toHaveLength(2);
  });

  it('aborts replacement requests and ignores a stale response even when the network ignores cancellation', async () => {
    const first = deferred<Response>();
    const second = deferred<Response>();
    const fetchMock = vi.fn().mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise);
    vi.stubGlobal('fetch', fetchMock);
    const svg = createRef<Two.Group>();
    const onLoad = vi.fn();
    const onError = vi.fn();
    const view = (src: string) => <Canvas><SVG ref={svg} src={src} onLoad={onLoad} onError={onError} /></Canvas>;
    const { rerender, unmount } = render(view('/first.svg?revision=1'));
    const firstSignal = fetchMock.mock.calls[0][1].signal;
    rerender(view('/second.svg'));
    expect(firstSignal.aborted).toBe(true);
    await act(async () => { second.resolve(response()); });
    const winner = svg.current!.children[0];
    await act(async () => { first.resolve(response('<svg><rect width="40" height="40" /></svg>')); });
    expect(svg.current!.children).toEqual([winner]);
    expect(onLoad).toHaveBeenCalledTimes(1);
    expect(onError).not.toHaveBeenCalled();
    const unbind = vi.spyOn(winner, 'unbind');
    unmount();
    expect(unbind).toHaveBeenCalled();
    expect(fetchMock.mock.calls[1][1].signal.aborted).toBe(true);
  });

  it('ignores pending URL results and errors after unmount', async () => {
    const pending = deferred<Response>();
    vi.stubGlobal('fetch', vi.fn(() => pending.promise));
    const onLoad = vi.fn();
    const onError = vi.fn();
    const { unmount } = render(<Canvas><SVG src="/pending.svg" onLoad={onLoad} onError={onError} /></Canvas>);
    unmount();
    await act(async () => { pending.reject(new Error('aborted')); });
    expect(onLoad).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it.each(['<svg><g></svg>', '<div>not svg</div>', ''])('reports invalid inline content exactly once: %s', (content) => {
    const onLoad = vi.fn();
    const onError = vi.fn();
    render(<Canvas><SVG content={content} onLoad={onLoad} onError={onError} /></Canvas>);
    expect(onLoad).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
    expect(onError.mock.calls[0][0]).toBeInstanceOf(Error);
  });

  it.each(['http', 'network', 'markup'])('reports %s URL failures exactly once', async (kind) => {
    vi.stubGlobal('fetch', vi.fn(async () => {
      if (kind === 'network') throw new Error('network unavailable');
      return kind === 'http' ? { ok: false, status: 404 } : response('<html></html>');
    }));
    const onLoad = vi.fn();
    const onError = vi.fn();
    await act(async () => { render(<Canvas><SVG src="/bad.svg" onLoad={onLoad} onError={onError} /></Canvas>); });
    expect(onLoad).not.toHaveBeenCalled();
    expect(onError).toHaveBeenCalledTimes(1);
  });

  it('uses latest callbacks without reloading and preserves JSX sibling ordering', () => {
    const svg = createRef<Two.Group>();
    const before = createRef<Two.Circle>();
    const after = createRef<Two.Circle>();
    const load = vi.spyOn(Two.prototype, 'load');
    const view = (onLoad: () => void) => <Canvas>
      <Circle ref={before} radius={2} />
      <SVG ref={svg} content={artwork} onLoad={onLoad} />
      <Circle ref={after} radius={2} /><Probe />
    </Canvas>;
    const { rerender } = render(view(vi.fn()));
    rerender(view(vi.fn()));
    expect(load).toHaveBeenCalledTimes(1);
    expect(instance!.scene.children).toEqual([before.current, svg.current, after.current]);
  });

  it('retains one import after StrictMode effect replay', () => {
    const ref = createRef<Two.Group>();
    render(<StrictMode><Canvas><SVG ref={ref} content={artwork} /></Canvas></StrictMode>);
    expect(ref.current!.children).toHaveLength(1);
  });
});

describe('SVG ownership and callbacks', () => {
  it('does not release borrowed declarative gradients when imported content is replaced', () => {
    const gradient = new Two.LinearGradient(0, 0, 100, 0, [new Two.Stop(0, 'red'), new Two.Stop(1, 'blue')]);
    const unbind = vi.spyOn(gradient, 'unbind');
    const view = (content: string) => <Canvas><SVG content={content} fill={gradient} /></Canvas>;
    const { rerender } = render(view(artwork));
    rerender(view('<svg><circle r="5" /></svg>'));
    expect(unbind).not.toHaveBeenCalled();
  });

  it('uses the latest callback for pending URL loads without restarting the request', async () => {
    const pending = deferred<Response>();
    const fetchMock = vi.fn(() => pending.promise);
    vi.stubGlobal('fetch', fetchMock);
    const first = vi.fn();
    const last = vi.fn();
    const { rerender } = render(<Canvas><SVG src="/pending.svg" onLoad={first} /></Canvas>);
    rerender(<Canvas><SVG src="/pending.svg" onLoad={last} /></Canvas>);
    await act(async () => pending.resolve(response()));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(first).not.toHaveBeenCalled();
    expect(last).toHaveBeenCalledTimes(1);
  });

  it('does not classify user onLoad exceptions as loading errors', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const onError = vi.fn();
    render(<Canvas><SVG content={artwork} onLoad={() => { throw new Error('callback failure'); }} onError={onError} /></Canvas>);
    expect(onError).not.toHaveBeenCalled();
  });
});

it('keeps imports before JSX children when the JSX children are reordered', () => {
  const svg = createRef<Two.Group>();
  const first = createRef<Two.Circle>();
  const last = createRef<Two.Circle>();
  const view = (reverse: boolean) => <Canvas><SVG ref={svg} content={artwork}>
    {reverse ? [<Circle key="last" ref={last} radius={2} />, <Circle key="first" ref={first} radius={2} />]
      : [<Circle key="first" ref={first} radius={2} />, <Circle key="last" ref={last} radius={2} />]}
  </SVG></Canvas>;
  const { rerender } = render(view(false));
  const imported = svg.current!.children[0];
  expect(svg.current!.children).toEqual([imported, first.current, last.current]);
  rerender(view(true));
  expect(svg.current!.children).toEqual([imported, last.current, first.current]);
});
