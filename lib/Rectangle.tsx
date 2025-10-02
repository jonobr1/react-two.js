import React, { useEffect, useImperativeHandle, useState } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Rectangle as Instance } from 'two.js/src/shapes/rectangle';
import { PathProps } from './Path';

export type RectangleProps = PathProps | 'width' | 'height';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<RectangleProps, keyof Instance>]?: Instance[K];
  } & {
    x?: number;
    y?: number;
  }
>;

export type RefRectangle = Instance;

export const Rectangle = React.forwardRef<Instance, ComponentProps>(
  ({ x, y, ...props }, forwardedRef) => {
    const { two, parent } = useTwo();
    const [ref, set] = useState<Instance | null>(null);

    useEffect(() => {
      const rectangle = new Two.Rectangle();
      set(rectangle);

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
        const rectangle = ref;
        // Update position
        if (typeof x === 'number') rectangle.translation.x = x;
        if (typeof y === 'number') rectangle.translation.y = y;

        // Update other properties
        for (const key in props) {
          if (key in rectangle) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (rectangle as any)[key] = (props as any)[key];
          }
        }
      }
    }, [props, ref, x, y]);

    useImperativeHandle(forwardedRef, () => ref as Instance, [ref]);

    return <></>;
  }
);
