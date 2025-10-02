import React, { useEffect, useImperativeHandle, useState } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { RoundedRectangle as Instance } from 'two.js/src/shapes/rounded-rectangle';
import { PathProps } from './Path';

type RoundedRectangleProps = PathProps | 'width' | 'height' | 'radius';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<RoundedRectangleProps, keyof Instance>]?: Instance[K];
  } & {
    x?: number;
    y?: number;
  }
>;

export type RefRoundedRectangle = Instance;

export const RoundedRectangle = React.forwardRef<Instance, ComponentProps>(
  ({ x, y, ...props }, forwardedRef) => {
    const { two, parent } = useTwo();
    const [ref, set] = useState<Instance | null>(null);

    useEffect(() => {
      const roundedRectangle = new Two.RoundedRectangle();
      set(roundedRectangle);

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
        const roundedRectangle = ref;
        // Update position
        if (typeof x === 'number') roundedRectangle.translation.x = x;
        if (typeof y === 'number') roundedRectangle.translation.y = y;

        // Update other properties
        for (const key in props) {
          if (key in roundedRectangle) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (roundedRectangle as any)[key] = (props as any)[key];
          }
        }
      }
    }, [props, ref, x, y]);

    useImperativeHandle(forwardedRef, () => ref as Instance, [ref]);

    return <></>;
  }
);
