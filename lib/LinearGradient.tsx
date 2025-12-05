import React, { useImperativeHandle, useEffect, useMemo, useRef } from 'react';
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
    const applied = useRef<Record<string, unknown>>({});

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
    }, [gradient, x1, y1, x2, y2, props]);

    useImperativeHandle(forwardedRef, () => gradient, [gradient]);

    return null; // No visual representation
  }
);
