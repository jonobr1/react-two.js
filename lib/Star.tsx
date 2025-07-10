import React, { useEffect, useImperativeHandle, useRef } from 'react';
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

export const Star = React.forwardRef<Instance | null, ComponentProps>(
  ({ x, y, ...props }, forwardedRef) => {
    const { two, parent } = useTwo();
    const ref = useRef<Instance | null>(null);

    useEffect(() => {
      const star = new Two.Star(
        x,
        y,
        props.innerRadius,
        props.outerRadius,
        props.sides
      );
      ref.current = star;

      return () => {
        ref.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [x, y, two]);

    useEffect(() => {
      const star = ref.current;
      if (parent && star) {
        parent.add(star);
        update();

        return () => {
          parent.remove(star);
        };
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parent]);

    useEffect(update, [props]);

    function update() {
      if (ref.current) {
        const star = ref.current;
        for (const key in props) {
          if (key in star) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (star as any)[key] = (props as any)[key];
          }
        }
      }
    }

    useImperativeHandle(forwardedRef, () => ref.current as Instance, []);

    return <></>;
  }
);
