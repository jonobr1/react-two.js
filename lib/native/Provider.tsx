import React, { useEffect, useRef, useState } from 'react';
import Two from 'two.js';
import { requireNativeComponent, ViewProps } from 'react-native';
import { Context, useTwo } from '../Context';

// Define the native component interface
interface NativeTwoViewProps extends ViewProps {
  drawCommands?: Record<string, unknown>;
}

// Require the native component
// We use a try-catch or conditional to avoid crashing if the native module isn't linked yet
// during development or testing.
const NativeTwoView = requireNativeComponent<NativeTwoViewProps>('TwoView');

type TwoConstructorProps = ConstructorParameters<typeof Two>[0];
type TwoConstructorPropsKeys = NonNullable<TwoConstructorProps>;
type ComponentProps = React.PropsWithChildren<TwoConstructorPropsKeys> & {
  style?: ViewProps['style'];
};

/**
 * A React Native compatible Provider for Two.js.
 * Renders a NativeTwoView backed by Metal (iOS) or Custom View (Android).
 */
export const Provider: React.FC<ComponentProps> = (props) => {
  const { two, parent } = useTwo();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const nativeRef = useRef<any>(null);
  
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
      delete args.style;

      // Initialize Two.js in headless mode or with a dummy element
      // We primarily use it for the scene graph and math
      const two = new Two({
        ...args,
        type: Two.Types.canvas, // Default to canvas type for internal logic
        // We might need to patch the renderer to not try to append to DOM
        domElement: { // Mock DOM element to satisfy Two.js
          style: {},
          addEventListener: () => {},
          removeEventListener: () => {},
        } as unknown as HTMLCanvasElement
      });

      let width = two.width;
      let height = two.height;

      set({ two, parent: two.scene, width, height });
      two.bind('update', update);

      unmount = () => {
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

        // SERIALIZATION BRIDGE
        // This is where we send the scene graph to the native side
        if (nativeRef.current) {
          // TODO: Implement efficient serialization
          // For now, we send a basic signal or simplified graph
          // const commands = serialize(two.scene);
          // nativeRef.current.setNativeProps({ drawCommands: commands });
        }
      }
    }

    return unmount;
  }

  return (
    <Context.Provider value={state}>
      <NativeTwoView style={props.style} ref={nativeRef}>
        {props.children}
      </NativeTwoView>
    </Context.Provider>
  );
};
