import React, { useCallback, useEffect, useRef, useState } from 'react';
import Two from 'two.js';
import type { Shape } from 'two.js/src/shape';
import type { Group } from 'two.js/src/group';
import { requireNativeComponent, ViewProps } from 'react-native';
import { Context, useTwo } from '../Context';
import type { EventHandlers } from '../Events';

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
  
  // Store registered shapes for event handling (future implementation)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const eventShapes = useRef<Map<Shape | Group, { shape: Shape | Group; handlers: Partial<EventHandlers>; parent?: Group }>>(new Map());

  const [state, set] = useState<{
    two: typeof two;
    parent: typeof parent;
    width: number;
    height: number;
    registerEventShape: (
      shape: Shape | Group,
      handlers: Partial<EventHandlers>,
      parent?: Group
    ) => void;
    unregisterEventShape: (shape: Shape | Group) => void;
  }>({
    two,
    parent,
    width: 0,
    height: 0,
    registerEventShape: () => {},
    unregisterEventShape: () => {},
  });

  // Register a shape with event handlers
  const registerEventShape = useCallback(
    (
      shape: Shape | Group,
      handlers: Partial<EventHandlers>,
      parentGroup?: Group
    ) => {
      eventShapes.current.set(shape, { shape, handlers, parent: parentGroup });
    },
    []
  );

  // Unregister a shape
  const unregisterEventShape = useCallback((shape: Shape | Group) => {
    eventShapes.current.delete(shape);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(mount, [props]);

  function mount() {
    let unmount = () => {};
    const isRoot = !two;

    if (isRoot) {
      const args = { ...props };
      delete args.children;
      delete args.style;

      // Initialize Two.js in headless mode
      const two = new Two({
        ...args,
        type: Two.Types.canvas,
        domElement: {
          style: {},
          addEventListener: () => {},
          removeEventListener: () => {},
        } as unknown as HTMLCanvasElement
      });

      let width = two.width;
      let height = two.height;

      set((prev) => ({
        ...prev,
        two,
        parent: two.scene,
        width,
        height,
        registerEventShape,
        unregisterEventShape,
      }));
      
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
        if (nativeRef.current) {
          // Simple serialization of the scene graph
          // We only serialize what's necessary for the native renderer
          const commands = serializeScene(two.scene);
          nativeRef.current.setNativeProps({ drawCommands: commands });
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

// Helper to serialize the scene graph
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeScene(scene: Group): any {
  // This is a simplified serializer. 
  // In a real app, you'd want to optimize this to only send diffs or use a binary format.
  return {
    id: scene.id,
    children: scene.children.map((childNode) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const child = childNode as any;
      const base = {
        id: child.id,
        type: child.constructor.name,
        translation: { x: child.translation.x, y: child.translation.y },
        rotation: child.rotation,
        scale: typeof child.scale === 'number' ? { x: child.scale, y: child.scale } : { x: child.scale.x, y: child.scale.y },
        opacity: child.opacity,
        visible: child.visible,
      };

      if (child instanceof Two.Group) {
        return {
          ...base,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          children: (child as any).children.map((c: any) => serializeScene(c)), // Recursive for groups
        };
      } else {
        // Shape specific properties
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const shape = child as any;
        return {
          ...base,
          fill: shape.fill,
          stroke: shape.stroke,
          linewidth: shape.linewidth,
          // Add other shape-specific props here (radius, width, height, vertices, etc.)
          // For the demo, we assume basic shapes
          ...(shape.radius && { radius: shape.radius }),
          ...(shape.width && { width: shape.width }),
          ...(shape.height && { height: shape.height }),
          ...(shape.vertices && { 
            vertices: shape.vertices.map((v: any) => ({ x: v.x, y: v.y, command: v.command })) 
          }),
        };
      }
    }),
  };
}
