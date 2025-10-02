import React, { useEffect, useImperativeHandle, useState } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Star as Instance } from 'two.js/src/shapes/star';
import { PathProps } from './Path';

type StarProps = PathProps | 'innerRadius' | 'outerRadius' | 'sides';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<StarProps, keyof Instance>]?: Instance[K];
  } & {
    x?: number;
    y?: number;
  }
>;

export type RefStar = Instance;

export const Star = React.forwardRef<Instance, ComponentProps>(
  ({ x, y, ...props }, forwardedRef) => {
    const { two, parent } = useTwo();
    const [ref, set] = useState<Instance | null>(null);

    useEffect(() => {
      const star = new Two.Star();
      set(star);

      return () => {
        set(null);
      };
    }, [two]);

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
        const star = ref;
        // Update position
        if (typeof x === 'number') star.translation.x = x;
        if (typeof y === 'number') star.translation.y = y;

        // Update other properties
        for (const key in props) {
          if (key in star) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (star as any)[key] = (props as any)[key];
          }
        }
      }
    }, [props, ref, x, y]);

    useImperativeHandle(forwardedRef, () => ref as Instance, [ref]);

    return <></>;
  }
);
