import React, { useEffect, useImperativeHandle, useRef } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Circle as Instance } from 'two.js/src/shapes/circle';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Properties = [...Two.Shape.Properties, ...Two.Circle.Properties];
type CircleProps = (typeof Properties)[number];
type ComponentProps = React.PropsWithChildren<{
  [K in CircleProps]?: Instance[K];
}>;

export type RefCircle = Instance;

export const Circle = React.forwardRef<Instance | null, ComponentProps>(
  (props, forwardedRef) => {
    const { two, parent } = useTwo();
    const ref = useRef<Instance | null>(null);

    useEffect(() => {
      const circle = new Two.Circle();
      ref.current = circle;

      return () => {
        ref.current = null;
      };
    }, [two]);

    useEffect(() => {
      const circle = ref.current;
      if (parent && circle) {
        parent.add(circle);
        update();

        return () => {
          parent.remove(circle);
        };
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parent]);

    useEffect(update, [props]);

    function update() {
      if (ref.current) {
        const circle = ref.current;
        for (const key in props) {
          if (key in circle) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (circle as any)[key] = (props as any)[key];
          }
        }
      }
    }

    useImperativeHandle(forwardedRef, () => ref.current as Instance);

    return <></>;
  }
);
