import React, { useEffect, useImperativeHandle, useRef } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Ellipse as Instance } from 'two.js/src/shapes/ellipse';
import { PathProps } from './Path';

type EllipseProps = PathProps | 'width' | 'height';
type ComponentProps = React.PropsWithChildren<{
  [K in EllipseProps]?: Instance[K];
}>;

export type RefEllipse = Instance;

export const Ellipse = React.forwardRef<Instance | null, ComponentProps>(
  (props, forwardedRef) => {
    const { two, parent } = useTwo();
    const ref = useRef<Instance | null>(null);

    useEffect(() => {
      const ellipse = new Two.Ellipse();
      ref.current = ellipse;

      return () => {
        ref.current = null;
      };
    }, [two]);

    useEffect(() => {
      const ellipse = ref.current;
      if (parent && ellipse) {
        parent.add(ellipse);
        update();

        return () => {
          parent.remove(ellipse);
        };
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parent]);

    useEffect(update, [props]);

    function update() {
      if (ref.current) {
        const ellipse = ref.current;
        for (const key in props) {
          if (key in ellipse) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (ellipse as any)[key] = (props as any)[key];
          }
        }
      }
    }

    useImperativeHandle(forwardedRef, () => ref.current as Instance);

    return <></>;
  }
);
