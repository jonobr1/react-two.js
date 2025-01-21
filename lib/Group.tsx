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

      return () => {
        parent.remove(group);
      };
    }
  }, [two, parent]);

  return (
    <Context.Provider value={{ two, parent: ref.current }}>
      {props.children}
    </Context.Provider>
  );
};
