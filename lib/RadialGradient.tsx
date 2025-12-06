import React, { useImperativeHandle, useEffect, useMemo } from 'react';
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

    useEffect(() => {
      if (typeof x === 'number') radialGradient.center.x = x;
      if (typeof y === 'number') radialGradient.center.y = y;

      if (typeof focalX === 'number') radialGradient.focal.x = focalX;
      if (typeof focalY === 'number') radialGradient.focal.y = focalY;

      // Update other properties (excluding event handlers)
      for (const key in props) {
        if (key in radialGradient) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (radialGradient as any)[key] = (props as any)[key];
        }
      }
    }, [props, radialGradient, x, y, focalX, focalY]);

    useImperativeHandle(forwardedRef, () => radialGradient, [radialGradient]);

    return null; // No visual representation
  }
);
