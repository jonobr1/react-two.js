import React, { useEffect, useRef } from 'react';
import Two from 'two.js';
import { Context } from './Context';

type TwoConstructorProps = ConstructorParameters<typeof Two>[0];
type TwoConstructorPropsKeys = NonNullable<TwoConstructorProps>;
type ComponentProps = React.PropsWithChildren<TwoConstructorPropsKeys>;

export const Provider: React.FC<ComponentProps> = (props) => {
  const container = useRef<HTMLDivElement | null>(null);
  const ref = useRef<Two | null>(null);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(mount, []);

  function mount() {
    const two = (ref.current = new Two(props).appendTo(container.current!));

    return unmount;

    function unmount() {
      // TODO: Release memory
      const index = Two.Instances.indexOf(two);
      Two.Instances.splice(index, 1);
      two.pause();
    }
  }

  return (
    <Context.Provider value={ref}>
      <div ref={container}>{props.children}</div>
    </Context.Provider>
  );
};
