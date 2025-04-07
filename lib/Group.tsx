import React, { useEffect, useImperativeHandle, useState } from 'react';
import Two from 'two.js';
import { Context, useTwo } from './Context';

import type { Group as Instance } from 'two.js/src/group';

type GroupProps =
  | (typeof Two.Element.Properties)[number]
  | (typeof Two.Shape.Properties)[number]
  | (typeof Two.Group.Properties)[number];
type ComponentProps = React.PropsWithChildren<{
  [K in GroupProps]?: Instance[K];
}>;

export type RefGroup = Instance;

export const Group = React.forwardRef<Instance | null, ComponentProps>(
  (props, forwardedRef) => {
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

    useImperativeHandle(forwardedRef, () => ref as Instance);

    return (
      <Context.Provider value={{ two, parent: ref, width, height }}>
        {props.children}
      </Context.Provider>
    );
  }
);
