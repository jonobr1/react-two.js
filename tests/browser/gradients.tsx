import { createRef } from 'react';
import { createRoot } from 'react-dom/client';
import { flushSync } from 'react-dom';
import Two from 'two.js';
import { Canvas, LinearGradient, RadialGradient, Rectangle, Stop, useTwo } from '../../lib/main';

const output = document.querySelector('#results')!;
const messages: string[] = [];
let two: Two | null = null;
// eslint-disable-next-line react-refresh/only-export-components
function Probe() { two = useTwo().two; return null; }
function assert(value: unknown, message: string): asserts value {
  if (!value) throw new Error(message);
}
const tick = () => new Promise<void>(resolve => requestAnimationFrame(() => resolve()));

async function run() {
  for (const type of ['svg', 'canvas', 'webgl'] as const) {
    for (const kind of ['linear', 'radial'] as const) {
      const container = document.createElement('div');
      document.querySelector('#test-root')!.append(container);
      two = null;
      const root = createRoot(container);
      const ref = createRef<Two.LinearGradient & Two.RadialGradient>();
      const rect = createRef<Two.Rectangle>();
      const Gradient = kind === 'linear' ? LinearGradient : RadialGradient;
      const draw = (reverse: boolean) => <Canvas type={type} width={100} height={100} ratio={1}>
        <Gradient ref={ref} x1={-50} x2={50} radius={50} units="userSpaceOnUse">
          {gradient => <>
            {(reverse ? ['blue', 'red'] : ['red', 'blue']).map((color, i) => <Stop key={color} color={color} offset={i} />)}
            <Rectangle ref={rect} x={50} y={50} width={100} height={100} fill={gradient} stroke="none" />
          </>}
        </Gradient><Probe />
      </Canvas>;
      flushSync(() => root.render(draw(false)));
      for (let attempt = 0; attempt < 30 && !two; attempt++) await tick();
      assert(two, `${type}: mounted`);
      two.update();
      const gradient = ref.current!;
      assert(gradient.stops.length === 2 && rect.current!.fill === gradient, `${type}/${kind}: binding`);
      const element = two.renderer.domElement;
      // Sample a real renderer, including GPU output through a 2D copy.
      const sample = () => {
        const copy = document.createElement('canvas'); copy.width = copy.height = 100;
        const ctx = copy.getContext('2d')!;
        ctx.drawImage(element as HTMLCanvasElement, 0, 0);
        return ctx.getImageData(kind === 'linear' ? 10 : 50, 50, 1, 1).data;
      };
      if (type === 'svg') {
        const stops = element.querySelectorAll('stop');
        assert(stops.length === 2 && stops[0].getAttribute('stop-color') === 'red', 'SVG stop colors');
      } else {
        const pixel = sample();
        assert(pixel[0] > pixel[2] + 100 && pixel[3] > 200, `${type}/${kind}: red pixel ${pixel}`);
      }
      flushSync(() => root.render(draw(true)));
      two.update();
      assert(ref.current === gradient && gradient.stops[0].color === 'blue', `${type}/${kind}: keyed reorder`);
      if (type !== 'svg') {
        const pixel = sample();
        assert(pixel[2] > pixel[0] + 100 && pixel[3] > 200, `${type}/${kind}: blue pixel ${pixel}`);
      } else {
        assert(element.querySelector('stop')?.getAttribute('stop-color') === 'blue', 'SVG updated stop color');
      }
      flushSync(() => root.unmount());
      await Promise.resolve();
      assert(gradient.stops.length === 0, `${type}/${kind}: ownership cleanup`);
      assert(!element.querySelector('linearGradient, radialGradient'), `${type}/${kind}: definitions removed`);
      container.remove();
      messages.push(`PASS ${type}/${kind}: fill binding, real rendered colors, keyed updates, cleanup`);
      output.textContent = messages.join('\n');
    }
  }
  output.textContent += '\nALL 6 GRADIENT RENDERER CHECKS PASSED';
}
void run().catch(error => { output.textContent = `${messages.join('\n')}\nFAIL ${String(error)}`; });
