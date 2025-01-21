import React, { useEffect, useRef, useState } from 'react';
import Two from 'two.js';
import { Context, useTwo } from './Context';

type TwoConstructorProps = ConstructorParameters<typeof Two>[0];
type TwoConstructorPropsKeys = NonNullable<TwoConstructorProps>;
type ComponentProps = React.PropsWithChildren<TwoConstructorPropsKeys>;

export const Provider: React.FC<ComponentProps> = (props) => {
  const { two, parent } = useTwo();
  const container = useRef<HTMLDivElement | null>(null);
  const [state, set] = useState<{ two: typeof two; parent: typeof parent }>({
    two,
    parent,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(mount, []);
  useEffect(update, [props]);

  function mount() {
    let unmount = () => {};
    const isRoot = !two;

    if (isRoot) {
      const two = new Two(props).appendTo(container.current!);
      set({ two, parent: two.scene });
      unmount = () => {
        // TODO: Release memory
        const index = Two.Instances.indexOf(two);
        Two.Instances.splice(index, 1);
        two.pause();
      };
    }

    return unmount;
  }

  // TODO: Control auto-updating, animation loop, etc.
  function update() {
    set(({ two, parent }) => {
      if (two) {
        for (const key in props) {
          if (key in two) {
            // TODO: Test
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (two as any)[key] = (props as any)[key];
          }
        }
      }
      return { two, parent };
    });
  }

  return (
    <Context.Provider value={state}>
      <div ref={container}>{props.children}</div>
    </Context.Provider>
  );
};
