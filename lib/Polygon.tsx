import React, { useEffect, useImperativeHandle, useRef } from 'react';
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

export const Polygon = React.forwardRef<Instance | null, ComponentProps>(
  ({ x, y, radius, ...props }, forwardedRef) => {
    const { two, parent } = useTwo();
    const ref = useRef<Instance | null>(null);

    useEffect(() => {
      const polygon = new Two.Polygon(x, y, radius, props.sides);
      ref.current = polygon;

      return () => {
        ref.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [x, y, radius, two]);

    useEffect(() => {
      const polygon = ref.current;
      if (parent && polygon) {
        parent.add(polygon);
        update();

        return () => {
          parent.remove(polygon);
        };
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parent]);

    useEffect(update, [props]);

    function update() {
      if (ref.current) {
        const polygon = ref.current;
        for (const key in props) {
          if (key in polygon) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (polygon as any)[key] = (props as any)[key];
          }
        }
      }
    }

    useImperativeHandle(forwardedRef, () => ref.current!);

    return <></>;
  }
);
