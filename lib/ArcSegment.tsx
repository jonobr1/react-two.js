import React, { useEffect, useImperativeHandle, useRef } from 'react';
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

export const ArcSegment = React.forwardRef<Instance | null, ComponentProps>(
  ({ x, y, resolution, ...props }, forwardedRef) => {
    const { two, parent } = useTwo();
    const ref = useRef<Instance | null>(null);

    useEffect(() => {
      const arcSegment = new Two.ArcSegment(
        x,
        y,
        props.innerRadius,
        props.outerRadius,
        props.startAngle,
        props.endAngle,
        resolution
      );
      ref.current = arcSegment;

      return () => {
        ref.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [x, y, resolution, two]);

    useEffect(() => {
      const arcSegment = ref.current;
      if (parent && arcSegment) {
        parent.add(arcSegment);
        update();

        return () => {
          parent.remove(arcSegment);
        };
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parent]);

    useEffect(update, [props]);

    function update() {
      if (ref.current) {
        const arcSegment = ref.current;
        for (const key in props) {
          if (key in arcSegment) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (arcSegment as any)[key] = (props as any)[key];
          }
        }
      }
    }

    useImperativeHandle(forwardedRef, () => ref.current!);

    return <></>;
  }
);
