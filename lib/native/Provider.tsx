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
  return serializeNode(scene);
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function serializeNode(node: any): any {
  if (!node) return null;

  const base: any = {
    id: node.id,
    type: node.constructor.name,
    translation: { x: node.translation.x, y: node.translation.y },
    rotation: node.rotation,
    scale: typeof node.scale === 'number' ? { x: node.scale, y: node.scale } : { x: node.scale.x, y: node.scale.y },
    opacity: node.opacity,
    visible: node.visible,
  };

  if (node instanceof Two.Group) {
    return {
      ...base,
      children: node.children.map((child: any) => serializeNode(child)),
    };
  } else {
    // Shape specific properties
    const shape = node as any;
    const serialized: any = {
      ...base,
      fill: typeof shape.fill === 'string' ? shape.fill : undefined,
      stroke: typeof shape.stroke === 'string' ? shape.stroke : undefined,
      linewidth: shape.linewidth,
      cap: shape.cap,
      join: shape.join,
      miter: shape.miter,
      closed: shape.closed,
      curved: shape.curved,
      automatic: shape.automatic,
      beginning: shape.beginning,
      ending: shape.ending,
    };

    if (shape.vertices && Array.isArray(shape.vertices)) {
      serialized.vertices = shape.vertices.map((v: any) => ({
        x: v.x,
        y: v.y,
        command: v.command,
        controls: v.controls ? {
          left: v.controls.left ? { x: v.controls.left.x, y: v.controls.left.y } : undefined,
          right: v.controls.right ? { x: v.controls.right.x, y: v.controls.right.y } : undefined,
        } : undefined
      }));
    }

    // Handle specific shape types if they have extra properties
    if (shape.radius) serialized.radius = shape.radius;
    if (shape.width) serialized.width = shape.width;
    if (shape.height) serialized.height = shape.height;

    return serialized;
  }
}
