import { createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import Two from 'two.js';
import { Canvas, Circle, Group, Rectangle, SVG, useTwo, type TwoEvent } from '../../lib/main';

const results = document.querySelector('#results')!;
const messages: string[] = [];
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
const frame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
let instance: Two | null = null;
// This standalone test fixture is not a Fast Refresh component module.
// eslint-disable-next-line react-refresh/only-export-components
function Probe() { instance = useTwo().two; return null; }
const root = createRoot(document.querySelector('#test-root')!);
const variants = ['svg', 'SVGRenderer', 'canvas', 'CanvasRenderer', 'webgl', 'WebGLRenderer'] as const;
async function run() {
  for (const type of variants) {
    const events: TwoEvent[] = [];
    const mask = new Two.Circle(0, 0, 20);
    const svg = createRef<Two.Group>();
    let resolveLoad!: () => void;
    let rejectLoad!: (error: Error) => void;
    const loaded = new Promise<void>((resolve, reject) => { resolveLoad = resolve; rejectLoad = reject; });
    flushSync(() => root.render(<Canvas key={type} type={type} width={800} height={600} {...(/svg/i.test(type) ? { viewBox: "0 0 800 600" } : {})} style={{ width: '400px', height: '300px' }}>
      <Group x={200} y={150} mask={mask} onClick={(event) => events.push(event)} onWheel={(event) => events.push(event)}>
        <Rectangle width={200} height={200} fill="blue" stroke="none" />
      </Group>
      <SVG ref={svg} shallow onLoad={resolveLoad} onError={rejectLoad} content='<svg xmlns="http://www.w3.org/2000/svg"><circle cx="500" cy="300" r="30" /></svg>' />
      <Probe />
    </Canvas>));
    await Promise.race([loaded, new Promise((_, reject) => setTimeout(() => reject(new Error(`${type}: SVG load timeout`)), 2000))]);
    await frame();
    const two = instance!;
    assert(two, `${type}: mounted`);
    const expected = /webgl/i.test(type) ? Two.Types.webgl : /canvas/i.test(type) ? Two.Types.canvas : Two.Types.svg;
    assert(two.type === expected, `${type}: normalized type`);
    two.update();
    assert(svg.current?.children[0] instanceof Two.Circle, `${type}: shallow SVG import (children=${svg.current?.children.length}, class=${svg.current?.children[0]?.constructor.name})`);
    const element = two.renderer.domElement;
    const bounds = element.getBoundingClientRect();
    const center = { clientX: Math.round(bounds.left + bounds.width / 4), clientY: Math.round(bounds.top + bounds.height / 4), bubbles: true };
    element.dispatchEvent(new MouseEvent('click', center));
    element.dispatchEvent(new WheelEvent('wheel', center));
    assert(events.length === 2, `${type}: click and wheel bubble through group mask`);
    for (const event of events) {
      assert(Math.abs(event.point.x - (center.clientX - bounds.left) * 800 / bounds.width) < 0.01 && Math.abs(event.point.y - (center.clientY - bounds.top) * 600 / bounds.height) < 0.01, `${type}: CSS-scaled world point`);
      assert(event.target instanceof Two.Rectangle, `${type}: actual leaf target`);
    }
    element.dispatchEvent(new MouseEvent('click', { ...center, clientX: center.clientX + 25 }));
    assert(events.length === 2, `${type}: mask excludes outside geometry`);
    messages.push(`PASS ${type}: real renderer, CSS coordinates, masked group events, shallow SVG`);
    results.textContent = messages.join('\n');
  }
  root.unmount();
  results.textContent = `${messages.join('\n')}\nALL 6 RENDERER VARIANTS PASSED`;
}
void run().catch((error) => { results.textContent = `${messages.join('\n')}\nFAIL ${String(error)}`; });

const dragRoot = createRoot(document.querySelector('#drag-root')!);
const dragResults = document.querySelector('#drag-results')!;
function showDrag(type: 'svg' | 'canvas' | 'webgl') {
  const log: string[] = [];
  const record = (message: string) => { log.push(message); dragResults.textContent = log.join('\n'); };
  let moved = false;
  let bubbled = false;
  const onDown = (event: TwoEvent) => {
    const pointerId = (event.nativeEvent as PointerEvent).pointerId;
    event.setPointerCapture(pointerId);
    record(`CAPTURE ${type}: ${event.hasPointerCapture(pointerId)}; point ${Math.round(event.point.x)},${Math.round(event.point.y)}`);
  };
  const onMove = (event: TwoEvent) => {
    if (event.hasPointerCapture((event.nativeEvent as PointerEvent).pointerId) && !moved) {
      moved = true;
      record(`MOVE ${type}: captured`);
    }
  };
  const onUp = (event: TwoEvent) => {
    const pointerId = (event.nativeEvent as PointerEvent).pointerId;
    const point = event.point;
    event.releasePointerCapture(pointerId);
    record(`RELEASE ${type}: ${!event.hasPointerCapture(pointerId)}; point ${Math.round(point.x)},${Math.round(point.y)}`);
  };
  flushSync(() => dragRoot.render(<Canvas key={type} type={type} width={800} height={600} {...(type === "svg" ? { viewBox: "0 0 800 600" } : {})} autostart
    style={{ width: '400px', height: '300px', display: 'block', background: '#eee', touchAction: 'none' }}>
    <Group onPointerMove={() => {
      if (moved && !bubbled) { bubbled = true; record(`MOVE ${type}: bubbled`); }
    }}>
      <Circle x={200} y={150} radius={50} fill="blue" stroke="none" onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} />
    </Group>
  </Canvas>));
  dragResults.textContent = `Ready for ${type}: drag the circle outside the grey renderer.`;
}
for (const type of ['svg', 'canvas', 'webgl'] as const) {
  document.querySelector(`#${type}`)!.addEventListener('click', () => showDrag(type));
}
showDrag('svg');
