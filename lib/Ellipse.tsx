import React, { useEffect, useImperativeHandle, useState } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Ellipse as Instance } from 'two.js/src/shapes/ellipse';
import { PathProps } from './Path';

type EllipseProps = PathProps | 'width' | 'height';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<EllipseProps, keyof Instance>]?: Instance[K];
  } & {
    x?: number;
    y?: number;
    resolution?: number;
  }
>;

export type RefEllipse = Instance;

export const Ellipse = React.forwardRef<Instance | null, ComponentProps>(
  ({ x, y, resolution, ...props }, forwardedRef) => {
    const { two, parent } = useTwo();
    const [ref, set] = useState<Instance | null>(null);

    useEffect(() => {
      const ellipse = new Two.Ellipse(0, 0, 0, 0, resolution);
      set(ellipse);

      return () => {
        set(null);
      };
    }, [resolution, two]);

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
        const ellipse = ref;
        // Update position
        if (typeof x === 'number') ellipse.translation.x = x;
        if (typeof y === 'number') ellipse.translation.y = y;

        // Update other properties
        for (const key in props) {
          if (key in ellipse) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (ellipse as any)[key] = (props as any)[key];
          }
        }
      }
    }, [ref, x, y, props]);

    useImperativeHandle(forwardedRef, () => ref as Instance, [ref]);

    return <></>;
  }
);
