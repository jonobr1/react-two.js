import { createRef } from 'react';
import { render } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import Two from 'two.js';
import { Canvas, Circle, useTwo } from '../lib/main';

let instance: Two | null;
function Probe() {
  instance = useTwo().two;
  return null;
}
afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe('Canvas constructor options', () => {
  it.each(['svg', 'SVGRenderer', 'canvas', 'CanvasRenderer', 'webgl', 'WebGLRenderer'] as const)(
    'normalizes %s to the corresponding renderer constructor', (type) => {
      // Real GPU initialization is exercised by tests/browser, not jsdom.
      const webgl = vi.spyOn(Two, 'WebGLRenderer').mockImplementation(function(options) {
        return new Two.CanvasRenderer(options);
      } as unknown as typeof Two.WebGLRenderer);
      const { container } = render(<Canvas type={type} width={100} height={80}><Probe /></Canvas>);
      const expected = /svg/i.test(type) ? Two.Types.svg : /webgl/i.test(type) ? Two.Types.webgl : Two.Types.canvas;
      expect(instance?.type).toBe(expected);
      expect(container.querySelector(/svg/i.test(type) ? 'svg' : 'canvas')).toBeTruthy();
      expect(webgl).toHaveBeenCalledTimes(/webgl/i.test(type) ? 1 : 0);
    },
  );

  it('updates logical size and play/pause without replacing the scene', () => {
    const circle = createRef<Two.Circle>();
    const view = (width: number, autostart: boolean) => (
      <Canvas width={width} height={80} autostart={autostart}><Circle ref={circle} radius={10} /><Probe /></Canvas>
    );
    const { rerender } = render(view(100, false));
    const initial = instance;
    const shape = circle.current;
    rerender(view(200, true));
    expect(instance).toBe(initial);
    expect(circle.current).toBe(shape);
    expect(instance?.width).toBe(200);
    expect(instance?.playing).toBe(true);
    rerender(view(200, false));
    expect(instance?.playing).toBe(false);
  });

  it('warns for immutable changes and applies them on a key remount with cleanup', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const view = (changed: boolean, key = 'original') => (
      <Canvas key={key} type={changed ? 'canvas' : 'svg'} width={100} height={80}
        ratio={changed ? 2 : 1} overdraw={changed} smoothing={!changed} fullscreen={changed}>
        <Circle radius={10} /><Probe />
      </Canvas>
    );
    const { rerender, container } = render(view(false));
    const old = instance!;
    const oldElement = old.renderer.domElement;
    rerender(view(true));
    expect(instance).toBe(old);
    for (const key of ['type', 'ratio', 'overdraw', 'smoothing', 'fullscreen']) {
      expect(warn).toHaveBeenCalledWith(expect.stringContaining(`"${key}"`));
    }
    expect(container.querySelector('svg')).toBe(oldElement);
    // Remount renderer options without enabling fullscreen for this unit test.
    rerender(<Canvas key="new" type="canvas" width={100} height={80} ratio={2}><Circle radius={10} /><Probe /></Canvas>);
    expect(instance).not.toBe(old);
    expect(Two.Instances).not.toContain(old);
    expect(oldElement.isConnected).toBe(false);
    expect(old.scene.children).toHaveLength(0);
    expect(instance?.scene.children).toHaveLength(1);
  });

  it('removes fullscreen resize listeners and restores body styles on a key remount', () => {
    const remove = vi.spyOn(window, 'removeEventListener');
    const previousPosition = document.body.style.position;
    const { rerender } = render(<Canvas key="fullscreen" fullscreen><Probe /></Canvas>);
    const oldFit = instance!.fit;
    expect(document.body.style.position).toBe('fixed');
    document.body.style.backgroundColor = 'red';
    rerender(<Canvas key="normal"><Probe /></Canvas>);
    expect(remove).toHaveBeenCalledWith('resize', oldFit);
    expect(document.body.style.position).toBe(previousPosition);
    expect(document.body.style.backgroundColor).toBe('red');
    document.body.style.backgroundColor = '';
  });

  it('treats equivalent aliases as unchanged', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(<Canvas type="svg" />);
    rerender(<Canvas type="SVGRenderer" />);
    expect(warn).not.toHaveBeenCalled();
  });

  it('suppresses constructor-change warnings in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { rerender } = render(<Canvas type="svg" />);
    rerender(<Canvas type="canvas" />);
    expect(warn).not.toHaveBeenCalled();
  });
});
