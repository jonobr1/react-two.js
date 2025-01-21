import React, { useEffect, useState } from 'react';
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

export const Group: React.FC<ComponentProps> = (props) => {
  const { two, parent } = useTwo();
  const [ref, set] = useState<Instance | null>(null);

  useEffect(() => {
    if (two && parent) {
      const group = new Two.Group();
      parent.add(group);
      set(group);

      update();

      return () => {
        // TODO: Release from memory?
        parent.remove(group);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [two, parent]);

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

  return (
    <Context.Provider value={{ two, parent: ref }}>
      {props.children}
    </Context.Provider>
  );
};
