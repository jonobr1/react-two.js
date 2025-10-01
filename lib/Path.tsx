import React, { useEffect, useImperativeHandle, useRef } from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Path as Instance } from 'two.js/src/path';
import { ShapeProps } from './Properties';

export type PathProps =
  | ShapeProps
  | 'fill'
  | 'stroke'
  | 'linewidth'
  | 'opacity'
  | 'visible'
  | 'cap'
  | 'join'
  | 'miter'
  | 'closed'
  | 'curved'
  | 'automatic'
  | 'beginning'
  | 'ending'
  | 'dashes'
  | 'vertices';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<PathProps, keyof Instance>]?: Instance[K];
  } & {
    manual?: boolean;
    x?: number;
    y?: number;
  }
>;

export type RefPath = Instance;

export const Path = React.forwardRef<Instance | null, ComponentProps>(
  ({ manual, x, y, ...props }, forwardedRef) => {
    const { two, parent } = useTwo();
    const ref = useRef<Instance | null>(null);

    useEffect(() => {
      const path = new Two.Path();
      ref.current = path;

      if (manual) {
        ref.current.automatic = false;
      }

      if (typeof x === 'number') path.translation.x = x;
      if (typeof y === 'number') path.translation.y = y;

      return () => {
        ref.current = null;
      };
    }, [manual, two, x, y]);

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

    useImperativeHandle(forwardedRef, () => ref.current!);

    return <></>;
  }
);
