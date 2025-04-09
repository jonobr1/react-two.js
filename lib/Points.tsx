import React, { useEffect, useImperativeHandle, useRef } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Points as Instance } from 'two.js/src/shapes/points';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Properties = [
  ...Two.Shape.Properties,
  ...Two.Points.Properties,
  'vertices',
] as const;
type PathProps = (typeof Properties)[number];
type ComponentProps = React.PropsWithChildren<{
  [K in PathProps]?: Instance[K];
}>;

export type RefPoints = Instance;

export const Points = React.forwardRef<Instance | null, ComponentProps>(
  (props, forwardedRef) => {
    const { two, parent } = useTwo();
    const ref = useRef<Instance | null>(null);

    useEffect(() => {
      const points = new Two.Points();
      ref.current = points;

      return () => {
        ref.current = null;
      };
    }, [two]);

    useEffect(() => {
      const points = ref.current;
      if (parent && points) {
        parent.add(points);
        update();

        return () => {
          parent.remove(points);
        };
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parent]);

    useEffect(update, [props]);

    function update() {
      if (ref.current) {
        const points = ref.current;
        for (const key in props) {
          if (key in points) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (points as any)[key] = (props as any)[key];
          }
        }
      }
    }

    useImperativeHandle(forwardedRef, () => ref.current as Instance);

    return <></>;
  }
);
