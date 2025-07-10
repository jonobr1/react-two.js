import React, { useEffect, useImperativeHandle, useRef } from 'react';
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

export const Circle = React.forwardRef<Instance | null, ComponentProps>(
  ({ x, y, resolution, ...props }, forwardedRef) => {
    const { two, parent } = useTwo();
    const ref = useRef<Instance | null>(null);

    useEffect(() => {
      const circle = new Two.Circle(x, y, props.radius, resolution);
      ref.current = circle;

      return () => {
        ref.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [x, y, resolution, two]);

    useEffect(() => {
      const circle = ref.current;
      if (parent && circle) {
        parent.add(circle);
        update();

        return () => {
          parent.remove(circle);
        };
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parent]);

    useEffect(update, [props]);

    function update() {
      if (ref.current) {
        const circle = ref.current;
        for (const key in props) {
          if (key in circle) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (circle as any)[key] = (props as any)[key];
          }
        }
      }
    }

    useImperativeHandle(forwardedRef, () => ref.current as Instance, []);

    return <></>;
  }
);
