import React, { useImperativeHandle, useEffect, useMemo } from 'react';
import Two from 'two.js';

import type { LinearGradient as Instance } from 'two.js/src/effects/linear-gradient';
import { GradientProps } from './Properties';

type LinearGradientProps = GradientProps | 'left' | 'right';

type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<LinearGradientProps, keyof Instance>]?: Instance[K];
  } & {
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
  }
>;

export type RefLinearGradient = Instance;

export const LinearGradient = React.forwardRef<Instance, ComponentProps>(
  ({ x1, y1, x2, y2, ...props }, forwardedRef) => {
    const gradient = useMemo(() => new Two.LinearGradient(), []);

    useEffect(() => {
      if (typeof x1 === 'number') {
        gradient.left.x = x1;
      }
      if (typeof y1 === 'number') {
        gradient.left.y = y1;
      }
      if (typeof x2 === 'number') {
        gradient.right.x = x2;
      }
      if (typeof y2 === 'number') {
        gradient.right.y = y2;
      }

      // Update other properties (excluding event handlers)
      for (const key in props) {
        if (key in gradient) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (gradient as any)[key] = (props as any)[key];
        }
      }
    }, [gradient, x1, y1, x2, y2, props]);

    useImperativeHandle(forwardedRef, () => gradient, [gradient]);

    return null; // No visual representation
  }
);
