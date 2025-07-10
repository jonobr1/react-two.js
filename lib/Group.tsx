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

export const Group = React.forwardRef<Instance | null, ComponentProps>(
  ({ x, y, ...props }, forwardedRef) => {
    const { two, parent, width, height } = useTwo();
    const [ref, set] = useState<Instance | null>(null);

    useEffect(() => {
      if (two) {
        const group = new Two.Group();

        if (typeof x === 'number') {
          group.position.x = x;
        }
        if (typeof y === 'number') {
          group.position.y = y;
        }

        set(group);

        return () => {
          set(null);
        };
      }
    }, [x, y, two]);

    useEffect(() => {
      const group = ref;
      if (parent && group) {
        parent.add(group);
        update();

        return () => {
          parent.remove(group);
        };
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ref, parent]);

    useEffect(update, [props]);

    function update() {
      set((group) => {
        if (group) {
          const args = { ...props };
          delete args.children;
          for (const key in args) {
            if (key in group) {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              (group as any)[key] = (args as any)[key];
            }
          }
        }
        return group;
      });
    }

    useImperativeHandle(forwardedRef, () => ref as Instance, [ref]);

    return (
      <Context.Provider value={{ two, parent: ref, width, height }}>
        {props.children}
      </Context.Provider>
    );
  }
);
