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
    const radialGradient = useMemo(() => new Two.RadialGradient(), []);
    const applied = useRef<Record<string, unknown>>({});

    useEffect(() => {
      if (typeof x === 'number') radialGradient.center.x = x;
      if (typeof y === 'number') radialGradient.center.y = y;

      if (typeof focalX === 'number') radialGradient.focal.x = focalX;
      if (typeof focalY === 'number') radialGradient.focal.y = focalY;

      // Update other properties (excluding event handlers)
      for (const key in props) {
        if (key in radialGradient) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const nextVal = (props as any)[key];
          if (applied.current[key] !== nextVal) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (radialGradient as any)[key] = nextVal;
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
    }, [props, radialGradient, x, y, focalX, focalY]);

    useImperativeHandle(forwardedRef, () => radialGradient, [radialGradient]);

    return null; // No visual representation
  }
);
