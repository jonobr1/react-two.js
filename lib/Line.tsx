import React, { useEffect, useImperativeHandle, useRef } from 'react';
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

export const Line = React.forwardRef<Instance | null, ComponentProps>(
  ({ x1, y1, x2, y2, ...props }, forwardedRef) => {
    const { two, parent } = useTwo();
    const ref = useRef<Instance | null>(null);

    useEffect(() => {
      const line = new Two.Line(x1, y1, x2, y2);
      ref.current = line;

      return () => {
        ref.current = null;
      };
    }, [x1, y1, x2, y2, two]);

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

    useImperativeHandle(forwardedRef, () => ref.current!);

    return <></>;
  }
);
