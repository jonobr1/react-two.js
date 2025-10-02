import React, { useEffect, useImperativeHandle, useState } from 'react';
import Two from 'two.js';
import { Context, useTwo } from './Context';

import type { Group as Instance } from 'two.js/src/group';
import { ShapeProps } from './Properties';

type GroupProps =
  | ShapeProps
  | 'fill'
  | 'stroke'
  | 'linewidth'
  | 'cap'
  | 'join'
  | 'miter'
  | 'closed'
  | 'curved'
  | 'automatic';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<GroupProps, keyof Instance>]?: Instance[K];
  } & {
    x?: number;
    y?: number;
  }
>;

export type RefGroup = Instance;

export const Group = React.forwardRef<Instance, ComponentProps>(
  ({ x, y, ...props }, forwardedRef) => {
    const { two, parent, width, height } = useTwo();
    const [ref, set] = useState<Instance | null>(null);

    useEffect(() => {
      if (two) {
        const group = new Two.Group();

        set(group);

        return () => {
          set(null);
        };
      }
    }, [two]);

    useEffect(() => {
      const group = ref;
      if (parent && group) {
        parent.add(group);

        return () => {
          parent.remove(group);
        };
      }
    }, [ref, parent]);

    useEffect(() => {
      if (ref) {
        const group = ref;
        // Update position
        if (typeof x === 'number') group.translation.x = x;
        if (typeof y === 'number') group.translation.y = y;

        const args = { ...props };
        delete args.children; // Allow react to handle children

        // Update other properties
        for (const key in args) {
          if (key in group) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (group as any)[key] = (args as any)[key];
          }
        }
      }
    }, [ref, x, y, props]);

    useImperativeHandle(forwardedRef, () => ref as Instance, [ref]);

    return (
      <Context.Provider value={{ two, parent: ref, width, height }}>
        {props.children}
      </Context.Provider>
    );
  }
);
