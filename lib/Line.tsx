import React, { useEffect, useImperativeHandle, useState } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Line as Instance } from 'two.js/src/shapes/line';
import { PathProps } from './Path';

type LineProps = PathProps | 'left' | 'right';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<LineProps, keyof Instance>]?: Instance[K];
  } & {
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
  }
>;

export type RefLine = Instance;

export const Line = React.forwardRef<Instance, ComponentProps>(
  ({ x1, y1, x2, y2, ...props }, forwardedRef) => {
    const { two, parent } = useTwo();
    const [ref, set] = useState<Instance | null>(null);

    useEffect(() => {
      const line = new Two.Line();
      set(line);

      return () => {
        set(null);
      };
    }, [two]);

    useEffect(() => {
      const line = ref;
      if (parent && line) {
        parent.add(line);

        return () => {
          parent.remove(line);
        };
      }
    }, [parent, ref]);

    useEffect(() => {
      if (ref) {
        const line = ref;
        // Update vertices
        if (typeof x1 === 'number') line.left.x = x1;
        if (typeof y1 === 'number') line.left.y = y1;

        if (typeof x2 === 'number') line.right.x = x2;
        if (typeof y2 === 'number') line.right.y = y2;

        // Update other properties
        for (const key in props) {
          if (key in line) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (line as any)[key] = (props as any)[key];
          }
        }
      }
    }, [props, ref, x1, y1, x2, y2]);

    useImperativeHandle(forwardedRef, () => ref as Instance, [ref]);

    return <></>;
  }
);
