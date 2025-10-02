import React, { useEffect, useImperativeHandle, useState } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Polygon as Instance } from 'two.js/src/shapes/polygon';
import { PathProps } from './Path';

type PolygonProps = PathProps | 'width' | 'height' | 'sides';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<PolygonProps, keyof Instance>]?: Instance[K];
  } & {
    x?: number;
    y?: number;
    radius?: number;
  }
>;

export type RefPolygon = Instance;

export const Polygon = React.forwardRef<Instance, ComponentProps>(
  ({ x, y, ...props }, forwardedRef) => {
    const { two, parent } = useTwo();
    const [ref, set] = useState<Instance | null>(null);

    useEffect(() => {
      const polygon = new Two.Polygon();
      set(polygon);

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
        const polygon = ref;
        // Update position
        if (typeof x === 'number') polygon.translation.x = x;
        if (typeof y === 'number') polygon.translation.y = y;

        // Update other properties
        for (const key in props) {
          if (key in polygon) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (polygon as any)[key] = (props as any)[key];
          }
        }
      }
    }, [props, ref, x, y]);

    useImperativeHandle(forwardedRef, () => ref as Instance, [ref]);

    return <></>;
  }
);
