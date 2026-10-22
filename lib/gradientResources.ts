import type { LinearGradient } from 'two.js/src/effects/linear-gradient';
import type { RadialGradient } from 'two.js/src/effects/radial-gradient';

export type GradientResource = LinearGradient | RadialGradient;

// Inspect committed objects rather than prop values: Group setters can cascade
// paints to children, and fills can also be assigned through forwarded refs.
const consumers = new Set<object>();
const retired = new Set<GradientResource>();
let scheduled = false;

export function collectGradients() {
  if (scheduled || retired.size === 0) return;
  scheduled = true;
  queueMicrotask(() => {
    scheduled = false;
    for (const gradient of retired) {
      const used = [...consumers].some((object) => {
        const paint = object as { fill?: unknown; stroke?: unknown };
        return paint.fill === gradient || paint.stroke === gradient;
      });
      if (used) continue;
      retired.delete(gradient);
      // Two.js dispose assumes its SVG element still has a parent. A Canvas
      // may already have removed its document during the same React commit.
      const renderer = (gradient as unknown as { _renderer: { elem?: Element; effect?: unknown } })._renderer;
      renderer.elem?.remove();
      delete renderer.elem;
      gradient.dispose();
      gradient.stops = [];
      gradient.unbind();
    }
  });
}

export function trackGradientConsumer(object: object) {
  consumers.add(object);
  return () => { consumers.delete(object); collectGradients(); };
}

export function ownGradient(gradient: GradientResource) {
  retired.delete(gradient);
  return () => { retired.add(gradient); collectGradients(); };
}
