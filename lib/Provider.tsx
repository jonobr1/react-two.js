import React, { useEffect, useRef, useState } from 'react';
import Two from 'two.js';
import { Context, useTwo } from './Context';

type TwoConstructorProps = ConstructorParameters<typeof Two>[0];
type TwoConstructorPropsKeys = NonNullable<TwoConstructorProps>;
type ComponentProps = React.PropsWithChildren<TwoConstructorPropsKeys>;

export const Provider: React.FC<ComponentProps> = (props) => {
  const { two, parent } = useTwo();
  const container = useRef<HTMLDivElement | null>(null);
  const [state, set] = useState<{
    two: typeof two;
    parent: typeof parent;
    width: number;
    height: number;
  }>({
    two,
    parent,
    width: 0,
    height: 0,
  });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(mount, [props]);

  function mount() {
    let unmount = () => {};
    const isRoot = !two;

    if (isRoot) {
      const args = { ...props };
      delete args.children;

      const two = new Two(args).appendTo(container.current!);
      let width = two.width;
      let height = two.height;

      set({ two, parent: two.scene, width, height });
      two.bind('update', update);

      unmount = () => {
        two.renderer.domElement.parentElement?.removeChild(
          two.renderer.domElement
        );
        two.unbind('update', update);
        const index = Two.Instances.indexOf(two);
        Two.Instances.splice(index, 1);
        two.pause();
        two.release();
      };

      function update() {
        const widthFlagged = two.width !== width;
        const heightFlagged = false;

        if (widthFlagged) {
          width = two.width;
        }
        if (heightFlagged) {
          height = two.height;
        }
        if (widthFlagged || heightFlagged) {
          set((state) => ({ ...state, width, height }));
        }
      }
    }

    return unmount;
  }

  return (
    <Context.Provider value={state}>
      <div ref={container}>{props.children}</div>
    </Context.Provider>
  );
};
