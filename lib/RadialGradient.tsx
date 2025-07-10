import React, { useImperativeHandle, useEffect, useRef } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { RadialGradient as Instance } from 'two.js/src/effects/radial-gradient';
import { GradientProps } from './Properties';

type RadialGradientProps = GradientProps | 'center' | 'radius' | 'focal';

type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<RadialGradientProps, keyof Instance>]?: Instance[K];
  } & {
    x?: number;
    y?: number;
    focalX?: number;
    focalY?: number;
  }
>;

export type RefRadialGradient = Instance;

export const RadialGradient = React.forwardRef<Instance | null, ComponentProps>(
  ({ x, y, focalX, focalY, ...props }, forwardedRef) => {
    const { two } = useTwo();

    const ref = useRef<Instance | null>(null);

    if (!ref.current && two) {
      ref.current = new Two.RadialGradient(
        x,
        y,
        props.radius,
        props.stops,
        focalX,
        focalY
      );
    }

    useEffect(() => {
      if (ref.current) {
        if (typeof x === 'number') {
          ref.current.center.x = x;
        }
        if (typeof y === 'number') {
          ref.current.center.y = y;
        }
      }
    }, [x, y]);

    useEffect(() => {
      if (ref.current) {
        if (typeof focalX === 'number') {
          ref.current.focal.x = focalX;
        }
        if (typeof focalY === 'number') {
          ref.current.focal.y = focalY;
        }
      }
    }, [focalX, focalY]);

    useEffect(update, [props]);

    function update() {
      if (ref.current) {
        const gradient = ref.current;
        for (const key in props) {
          if (key in gradient) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (gradient as any)[key] = (props as any)[key];
          }
        }
      }
    }

    useImperativeHandle(forwardedRef, () => ref.current as Instance, []);

    return null; // No visual representation
  }
);
