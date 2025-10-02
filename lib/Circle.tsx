import React, { useEffect, useImperativeHandle, useState } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Circle as Instance } from 'two.js/src/shapes/circle';
import { PathProps } from './Path';

type CircleProps = PathProps | 'radius';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<CircleProps, keyof Instance>]?: Instance[K];
  } & {
    x?: number;
    y?: number;
    resolution?: number;
  }
>;

export type RefCircle = Instance;

export const Circle = React.forwardRef<Instance, ComponentProps>(
  ({ x, y, resolution, ...props }, forwardedRef) => {
    const { two, parent } = useTwo();
    const [ref, set] = useState<Instance | null>(null);

    useEffect(() => {
      const circle = new Two.Circle(0, 0, 0, resolution);
      set(circle);

      return () => {
        set(null);
      };
    }, [resolution, two]);

    useEffect(() => {
      if (ref) {
        const circle = ref;
        // Update position
        if (typeof x === 'number') circle.translation.x = x;
        if (typeof y === 'number') circle.translation.y = y;

        // Update other properties
        for (const key in props) {
          if (key in circle) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (circle as any)[key] = (props as any)[key];
          }
        }
      }
    }, [ref, props, x, y]);

    useEffect(() => {
      if (parent && ref) {
        parent.add(ref);
        return () => {
          parent.remove(ref);
        };
      }
    }, [parent, ref]);

    useImperativeHandle(forwardedRef, () => ref as Instance, [ref]);

    return <></>;
  }
);
