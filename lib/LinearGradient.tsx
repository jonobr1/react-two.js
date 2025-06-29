import React, { useImperativeHandle, useEffect, useRef } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { LinearGradient as Instance } from 'two.js/src/effects/linear-gradient';
import { GradientProps } from './Properties';

type LinearGradientProps = GradientProps | 'left' | 'right';

type ComponentProps = React.PropsWithChildren<
  {
    [K in LinearGradientProps]?: Instance[K];
  } & {
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
  }
>;

export type RefLinearGradient = Instance;

export const LinearGradient = React.forwardRef<Instance | null, ComponentProps>(
  ({ x1, y1, x2, y2, ...props }, forwardedRef) => {
    const { two } = useTwo();

    const ref = useRef<Instance | null>(null);

    if (!ref.current && two) {
      ref.current = new Two.LinearGradient(x1, y1, x2, y2, props.stops);
    }

    useEffect(() => {
      if (ref.current) {
        if (typeof x1 === 'number') {
          ref.current.left.x = x1;
        }
        if (typeof y1 === 'number') {
          ref.current.left.y = y1;
        }
        if (typeof x2 === 'number') {
          ref.current.right.x = x2;
        }
        if (typeof y2 === 'number') {
          ref.current.right.y = y2;
        }
      }
    }, [x1, y1, x2, y2]);

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

    useImperativeHandle(forwardedRef, () => ref.current!);

    return null; // No visual representation
  }
);
