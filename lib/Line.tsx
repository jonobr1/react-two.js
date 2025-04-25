import React, { useEffect, useImperativeHandle, useRef } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Line as Instance } from 'two.js/src/shapes/line';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Properties = [...Two.Shape.Properties, ...Two.Line.Properties];
type LineProps = (typeof Properties)[number];
type ComponentProps = React.PropsWithChildren<{
  [K in LineProps]?: Instance[K];
}>;

export type RefLine = Instance;

export const Line = React.forwardRef<Instance | null, ComponentProps>(
  (props, forwardedRef) => {
    const { two, parent } = useTwo();
    const ref = useRef<Instance | null>(null);

    useEffect(() => {
      const line = new Two.Line();
      ref.current = line;

      return () => {
        ref.current = null;
      };
    }, [two]);

    useEffect(() => {
      const line = ref.current;
      if (parent && line) {
        parent.add(line);
        update();

        return () => {
          parent.remove(line);
        };
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parent]);

    useEffect(update, [props]);

    function update() {
      if (ref.current) {
        const line = ref.current;
        for (const key in props) {
          if (key in line) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (line as any)[key] = (props as any)[key];
          }
        }
      }
    }

    useImperativeHandle(forwardedRef, () => ref.current as Instance);

    return <></>;
  }
);
