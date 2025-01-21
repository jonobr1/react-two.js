import React, { useEffect, useRef } from 'react';
import Two from 'two.js';
import { Context, useTwo } from './Context';
import type { Group as Instance } from 'two.js/src/group';

type GroupConstructorProps = (typeof Two.Group.Properties)[number];
type ComponentProps = React.PropsWithChildren<GroupConstructorProps>;

export const Group: React.FC<ComponentProps> = (props) => {
  const { two, parent } = useTwo();
  const ref = useRef<Instance | null>(null);

  useEffect(() => {
    if (two && parent) {
      const group = new Two.Group();
      parent.add(group);
      ref.current = group;

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
    if (ref.current) {
      const group = ref.current;
      for (const key in props) {
        if (key in group) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (group as any)[key] = (props as any)[key];
        }
      }
    }
  }

  return (
    <Context.Provider value={{ two, parent: ref.current }}>
      {props.children}
    </Context.Provider>
  );
};
