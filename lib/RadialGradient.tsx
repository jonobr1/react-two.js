import React, { useImperativeHandle, useEffect, useMemo, useRef } from 'react';
import Two from 'two.js';

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
    const ref = useMemo(() => new Two.RadialGradient(), []);
    const applied = useRef<Record<string, unknown>>({});

    // useEffect(() => {
    //   return () => {
    //     ref.dispose();
    //   };
    // }, [ref]);

    useEffect(() => {
      if (ref) {
        const gradient = ref;
        if (typeof x === 'number') ref.center.x = x;
        if (typeof y === 'number') ref.center.y = y;

        if (typeof focalX === 'number') ref.focal.x = focalX;
        if (typeof focalY === 'number') ref.focal.y = focalY;

        // Update other properties (excluding event handlers)
        for (const key in props) {
          if (key in gradient) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const nextVal = (props as any)[key];
            if (applied.current[key] !== nextVal) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (gradient as any)[key] = nextVal;
              applied.current[key] = nextVal;
            }
          }
        }

        // Drop any previously applied keys that are no longer present
        for (const key in applied.current) {
          if (!(key in props)) {
            delete applied.current[key];
          }
        }
      }
    }, [props, ref, x, y, focalX, focalY]);

    useImperativeHandle(forwardedRef, () => ref as Instance, [ref]);

    return null; // No visual representation
  }
);
