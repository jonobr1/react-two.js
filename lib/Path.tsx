import React, { useEffect, useImperativeHandle, useState } from 'react';
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

export const Path = React.forwardRef<Instance, ComponentProps>(
  ({ manual, x, y, ...props }, forwardedRef) => {
    const { two, parent } = useTwo();
    const [ref, set] = useState<Instance | null>(null);

    useEffect(() => {
      const path = new Two.Path();
      set(path);

      return () => {
        set(null);
      };
    }, [two]);

    useEffect(() => {
      if (parent && ref) {
        parent.add(ref);

        return () => {
          parent.remove(ref);
        };
      }
    }, [parent, ref]);

    useEffect(() => {
      if (ref) {
        const path = ref;
        // Update position
        if (typeof x === 'number') path.translation.x = x;
        if (typeof y === 'number') path.translation.y = y;

        if (typeof manual !== 'undefined') {
          path.automatic = !manual;
        }

        // Update other properties
        for (const key in props) {
          if (key in path) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (path as any)[key] = (props as any)[key];
          }
        }
      }
    }, [props, ref, x, y, manual]);

    useImperativeHandle(forwardedRef, () => ref as Instance, [ref]);

    return <></>;
  }
);
