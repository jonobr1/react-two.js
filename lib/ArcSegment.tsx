import React, { useEffect, useImperativeHandle, useState } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { ArcSegment as Instance } from 'two.js/src/shapes/arc-segment';
import { PathProps } from './Path';

type ArcSegmentProps =
  | PathProps
  | 'startAngle'
  | 'endAngle'
  | 'innerRadius'
  | 'outerRadius';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<ArcSegmentProps, keyof Instance>]?: Instance[K];
  } & {
    x?: number;
    y?: number;
    resolution?: number;
  }
>;

export type RefArcSegment = Instance;

export const ArcSegment = React.forwardRef<Instance, ComponentProps>(
  ({ x, y, resolution, ...props }, forwardedRef) => {
    const { two, parent } = useTwo();
    const [ref, set] = useState<Instance | null>(null);

    useEffect(() => {
      const arcSegment = new Two.ArcSegment(0, 0, 0, 0, 0, 0, resolution);
      set(arcSegment);

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
        const arcSegment = ref;
        // Update position
        if (typeof x === 'number') arcSegment.translation.x = x;
        if (typeof y === 'number') arcSegment.translation.y = y;

        // Update other properties
        for (const key in props) {
          if (key in arcSegment) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (arcSegment as any)[key] = (props as any)[key];
          }
        }
      }
    }, [props, ref, x, y]);

    useImperativeHandle(forwardedRef, () => ref as Instance, [ref]);

    return <></>;
  }
);
