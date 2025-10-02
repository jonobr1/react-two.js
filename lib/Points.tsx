import React, { useEffect, useImperativeHandle, useState } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Points as Instance } from 'two.js/src/shapes/points';
import { ShapeProps } from './Properties';

type PointsProps =
  | ShapeProps
  | 'fill'
  | 'stroke'
  | 'linewidth'
  | 'opacity'
  | 'visible'
  | 'size'
  | 'sizeAttenuation'
  | 'beginning'
  | 'ending'
  | 'dashes'
  | 'vertices';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<PointsProps, keyof Instance>]?: Instance[K];
  } & {
    x?: number;
    y?: number;
  }
>;

export type RefPoints = Instance;

export const Points = React.forwardRef<Instance, ComponentProps>(
  ({ x, y, ...props }, forwardedRef) => {
    const { two, parent } = useTwo();
    const [ref, set] = useState<Instance | null>(null);

    useEffect(() => {
      const points = new Two.Points();
      set(points);

      return () => {
        set(null);
      };
    }, [two, x, y]);

    useEffect(() => {
      if (parent && ref) {
        parent.add(ref);

        return () => {
          parent.remove(ref);
        };
      }
    }, [parent, ref]);

    useEffect(() => {
      if (ref) {
        const points = ref;
        // Update position
        if (typeof x === 'number') points.translation.x = x;
        if (typeof y === 'number') points.translation.y = y;

        // Update other properties
        for (const key in props) {
          if (key in points) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (points as any)[key] = (props as any)[key];
          }
        }
      }
    }, [props, ref, x, y]);

    useImperativeHandle(forwardedRef, () => ref as Instance, [ref]);

    return <></>;
  }
);
