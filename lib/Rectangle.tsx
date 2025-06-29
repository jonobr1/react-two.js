import React, { useEffect, useImperativeHandle, useRef } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Rectangle as Instance } from 'two.js/src/shapes/rectangle';
import { PathProps } from './Path';

type RectangleProps = PathProps | 'width' | 'height';
type ComponentProps = React.PropsWithChildren<
  {
    [K in RectangleProps]?: Instance[K];
  } & {
    x?: number;
    y?: number;
  }
>;

export type RefRectangle = Instance;

export const Rectangle = React.forwardRef<Instance | null, ComponentProps>(
  ({ x, y, ...props }, forwardedRef) => {
    const { two, parent } = useTwo();
    const ref = useRef<Instance | null>(null);

    useEffect(() => {
      const rectangle = new Two.Rectangle(x, y, props.width, props.height);
      ref.current = rectangle;

      return () => {
        ref.current = null;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [x, y, two]);

    useEffect(() => {
      const rectangle = ref.current;
      if (parent && rectangle) {
        parent.add(rectangle);
        update();

        return () => {
          parent.remove(rectangle);
        };
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parent]);

    useEffect(update, [props]);

    function update() {
      if (ref.current) {
        const rectangle = ref.current;
        for (const key in props) {
          if (key in rectangle) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (rectangle as any)[key] = (props as any)[key];
          }
        }
      }
    }

    useImperativeHandle(forwardedRef, () => ref.current as Instance);

    return <></>;
  }
);
