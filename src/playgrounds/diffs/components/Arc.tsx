import { useEffect, useMemo, useRef } from 'react';
import Two from 'two.js';
import TWEEN from '@tweenjs/tween.js';
import { Path, type RefPath } from 'react-two.js';
import { type Anchor } from 'two.js/src/anchor';

export interface ArcProps {
  source: { x: number; y: number };
  target: { x: number; y: number };
  delay?: number;
}

export function Arc({ source, target, delay = 0 }: ArcProps) {
  const pathRef = useRef<RefPath | null>(null);

  const vertices = useMemo(() => {
    const mx = (target.x + source.x) / 2;
    const my = (target.y + source.y) / 2;

    const dx = target.x - source.x;
    const dy = target.y - source.y;

    const r = Math.sqrt(dx * dx + dy * dy) / 2;
    const angle = Math.atan2(dy, dx);

    const resolution = 32;
    const points: Anchor[] = [];

    const cosA = Math.cos(angle);
    const sinA = Math.sin(angle);

    for (let i = 0; i < resolution; i++) {
      const pct = i / (resolution - 1);
      // Arc angle from 0 to -PI (upper semi-circle in local space)
      const theta = pct * -Math.PI;

      const lx = r * Math.cos(theta);
      const ly = r * Math.sin(theta);

      // Rotate by angle and translate to midpoint (mx, my)
      const wx = mx + (lx * cosA - ly * sinA);
      const wy = my + (lx * sinA + ly * cosA);

      points.push(new Two.Anchor(wx, wy));
    }

    return points;
  }, [source.x, source.y, target.x, target.y]);

  // The reveal writes straight to the Two.js path. Routing it through React
  // state would re-render the whole scene on every frame of every arc.
  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    path.beginning = 1;

    const value = { beginning: 1 };
    const tween = new TWEEN.Tween(value)
      .to({ beginning: 0 }, 350)
      .delay(delay)
      .easing(TWEEN.Easing.Sinusoidal.Out)
      .onUpdate(() => {
        const current = pathRef.current;
        if (current) {
          current.beginning = value.beginning;
        }
      })
      .start();

    return () => {
      tween.stop();
    };
  }, [source.x, source.y, target.x, target.y, delay]);

  return (
    <Path
      ref={pathRef}
      vertices={vertices}
      curved={true}
      ending={1}
      fill="none"
      stroke="#333"
      linewidth={1.5}
    />
  );
}
