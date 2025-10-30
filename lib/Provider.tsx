import React, { useEffect, useRef, useState } from 'react';
import Two from 'two.js';
import { Context, useTwo } from './Context';

type TwoConstructorProps = ConstructorParameters<typeof Two>[0];
type TwoConstructorPropsKeys = NonNullable<TwoConstructorProps>;
type ComponentProps = React.PropsWithChildren<TwoConstructorPropsKeys>;

/**
 * Validates that children are compatible with react-two.js Canvas.
 * Warns in development mode if DOM elements or incompatible components are found.
 */
function validateChildren(children: React.ReactNode): void {
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  React.Children.forEach(children, (child) => {
    if (!React.isValidElement(child)) {
      return;
    }

    const childType = child.type;

    // Check for DOM elements (string types like 'div', 'span', etc.)
    if (typeof childType === 'string') {
      console.warn(
        `[react-two.js] <${childType}> is not compatible with Canvas.\n` +
        `Only react-two.js components (Circle, Rectangle, Group, etc.) can be used inside <Canvas>.\n` +
        `Place DOM elements outside of the Canvas component.\n` +
        `See: https://github.com/jonobr1/react-two.js#usage`
      );
      return;
    }

    // Allow React.Fragment and other built-in React elements
    if (childType === React.Fragment) {
      validateChildren(child.props.children);
      return;
    }

    // Check for function/class components - validate their children recursively
    if (typeof childType === 'function' && child.props.children) {
      validateChildren(child.props.children);
    }
  });
}

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

  // Validate children in development mode
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production') {
      validateChildren(props.children);
    }
  }, [props.children]);

  return (
    <Context.Provider value={state}>
      <div ref={container}>{props.children}</div>
    </Context.Provider>
  );
};
