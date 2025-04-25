import React, { useEffect, useImperativeHandle, useRef } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { ArcSegment as Instance } from 'two.js/src/shapes/arc-segment';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Properties = [...Two.Shape.Properties, ...Two.ArcSegment.Properties];
type ArcSegmentProps = (typeof Properties)[number];
type ComponentProps = React.PropsWithChildren<{
  [K in ArcSegmentProps]?: Instance[K];
}>;

export type RefArcSegment = Instance;

export const ArcSegment = React.forwardRef<Instance | null, ComponentProps>(
  (props, forwardedRef) => {
    const { two, parent } = useTwo();
    const ref = useRef<Instance | null>(null);

    useEffect(() => {
      const arcSegment = new Two.ArcSegment();
      ref.current = arcSegment;

      return () => {
        ref.current = null;
      };
    }, [two]);

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

    useImperativeHandle(forwardedRef, () => ref.current as Instance);

    return <></>;
  }
);
