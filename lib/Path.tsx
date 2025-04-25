import React, { useEffect, useImperativeHandle, useRef } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Path as Instance } from 'two.js/src/path';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const Properties = [
  ...Two.Element.Properties,
  ...Two.Shape.Properties,
  ...Two.Path.Properties,
  'vertices',
] as const;
type PathProps = (typeof Properties)[number];
type ComponentProps = React.PropsWithChildren<{
  [K in PathProps extends keyof Instance ? K : never]?: Instance[K];
}>;

export type RefPath = Instance;

export const Path = React.forwardRef<Instance | null, ComponentProps>(
  (props, forwardedRef) => {
    const { two, parent } = useTwo();
    const ref = useRef<Instance | null>(null);

    useEffect(() => {
      const path = new Two.Path();
      ref.current = path;

      return () => {
        ref.current = null;
      };
    }, [two]);

    useEffect(() => {
      const path = ref.current;
      if (parent && path) {
        parent.add(path);
        update();

        return () => {
          parent.remove(path);
        };
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parent]);

    useEffect(update, [props]);

    function update() {
      if (ref.current) {
        const path = ref.current;
        for (const key in props) {
          if (key in path) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (path as any)[key] = (props as any)[key];
          }
        }
      }
    }

    useImperativeHandle(forwardedRef, () => ref.current as Instance);

    return <></>;
  }
);
