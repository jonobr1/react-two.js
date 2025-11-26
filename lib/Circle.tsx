import React, {
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from 'react';
import Two from 'two.js';
import { useTwo } from './Context';

import type { Circle as Instance } from 'two.js/src/shapes/circle';
import { PathProps } from './Path';
import { type EventHandlers } from './Properties';
import { EVENT_HANDLER_NAMES } from './Events';

type CircleProps = PathProps | 'radius';
type ComponentProps = React.PropsWithChildren<
  {
    [K in Extract<CircleProps, keyof Instance>]?: Instance[K];
  } & {
    x?: number;
    y?: number;
    resolution?: number;
  } & Partial<EventHandlers>
>;

export type RefCircle = Instance;

export const Circle = React.forwardRef<Instance, ComponentProps>(
  (
    {
      x,
      y,
      resolution,
      // Event handlers
      onClick,
      onContextMenu,
      onDoubleClick,
      onWheel,
      onPointerDown,
      onPointerUp,
      onPointerOver,
      onPointerOut,
      onPointerEnter,
      onPointerLeave,
      onPointerMove,
      onPointerCancel,
      // All other props are shape props
      ...shapeProps
    },
    forwardedRef
  ) => {
    const { two, parent, registerEventShape, unregisterEventShape } = useTwo();
    const [ref, set] = useState<Instance | null>(null);

    // Build event handlers object with explicit dependencies
    const eventHandlers = useMemo(
      () => ({
        ...(onClick && { onClick }),
        ...(onContextMenu && { onContextMenu }),
        ...(onDoubleClick && { onDoubleClick }),
        ...(onWheel && { onWheel }),
        ...(onPointerDown && { onPointerDown }),
        ...(onPointerUp && { onPointerUp }),
        ...(onPointerOver && { onPointerOver }),
        ...(onPointerOut && { onPointerOut }),
        ...(onPointerEnter && { onPointerEnter }),
        ...(onPointerLeave && { onPointerLeave }),
        ...(onPointerMove && { onPointerMove }),
        ...(onPointerCancel && { onPointerCancel }),
      }),
      [
        onClick,
        onContextMenu,
        onDoubleClick,
        onWheel,
        onPointerDown,
        onPointerUp,
        onPointerOver,
        onPointerOut,
        onPointerEnter,
        onPointerLeave,
        onPointerMove,
        onPointerCancel,
      ]
    );

    useEffect(() => {
      const circle = new Two.Circle(0, 0, 0, resolution);
      set(circle);

      return () => {
        set(null);
      };
    }, [resolution, two]);

    useEffect(() => {
      if (ref) {
        const circle = ref;
        // Update position
        if (typeof x === 'number') circle.translation.x = x;
        if (typeof y === 'number') circle.translation.y = y;

        // Update other properties (excluding event handlers)
        for (const key in shapeProps) {
          if (key in circle) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (circle as any)[key] = (shapeProps as any)[key];
          }
        }
      }
    }, [ref, shapeProps, x, y]);

    useEffect(() => {
      if (parent && ref) {
        parent.add(ref);
        return () => {
          parent.remove(ref);
        };
      }
    }, [parent, ref]);

    // Register event handlers
    useEffect(() => {
      if (ref && Object.keys(eventHandlers).length > 0) {
        registerEventShape(ref, eventHandlers, parent ?? undefined);

        return () => {
          unregisterEventShape(ref);
        };
      }
    }, [ref, registerEventShape, unregisterEventShape, parent, eventHandlers]);

    useImperativeHandle(forwardedRef, () => ref as Instance, [ref]);

    return <></>;
  }
);
